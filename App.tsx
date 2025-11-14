import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CourseDetail from './components/CourseDetail';
import type { Course } from './types';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { getCourses, addCourse, updateCourse, deleteCourse as removeCourse } from './services/courseService';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Start with loading true to check auth state

    const loadUserCourses = useCallback(async (userId: string) => {
        setIsLoading(true);
        try {
            const userCourses = await getCourses(userId);
            setCourses(userCourses);
        } catch (error) {
            console.error("Failed to load courses:", error);
            // Optionally set an error state to show in the UI
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (user) {
                loadUserCourses(user.uid);
            } else {
                setCourses([]);
                setIsLoading(false);
            }
        });
        return () => unsubscribe();
    }, [loadUserCourses]);
    
    const handleLogout = async () => {
        try {
            await signOut(auth);
            setSelectedCourse(null);
            setCourses([]);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const handleAddCourse = async (name: string, code: string, difficulty: number) => {
        if (!currentUser) return;
        const newCourseData = {
            name,
            code,
            difficulty,
            ca: { midSemester: null, assignment: null, quiz: null, attendance: null },
            targetGrade: 'A' as const,
        };
        await addCourse(currentUser.uid, newCourseData);
        loadUserCourses(currentUser.uid); // Re-fetch to get the new list with ID
    };
    
    const handleSaveCourse = async (updatedCourse: Course) => {
        if (!currentUser) return;
        await updateCourse(currentUser.uid, updatedCourse.id, updatedCourse);
        // Optimistic update
        setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
        setSelectedCourse(null); // Go back to dashboard
    };
    
    const handleDeleteCourse = async (courseId: string) => {
        if (!currentUser) return;
        await removeCourse(currentUser.uid, courseId);
        // Optimistic update
        setCourses(courses.filter(c => c.id !== courseId));
        setSelectedCourse(null); // Go back to dashboard
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-400"></div>
            </div>
        );
    }

    if (!currentUser) {
        return <Login />;
    }
    
    const viewKey = selectedCourse ? `detail-${selectedCourse.id}` : 'dashboard';

    return (
      <div key={viewKey} className="view-enter-active">
        {selectedCourse ? (
            <CourseDetail 
                course={selectedCourse} 
                onSave={handleSaveCourse}
                onBack={() => setSelectedCourse(null)}
                onDelete={handleDeleteCourse}
            />
        ) : (
            <Dashboard 
                user={currentUser} 
                courses={courses} 
                isLoading={isLoading}
                onSelectCourse={setSelectedCourse}
                onAddCourse={handleAddCourse}
                onLogout={handleLogout}
            />
        )}
      </div>
    );
};

export default App;