import React, { useState } from 'react';
import type { Course, GeminiAnalysis } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';
import { CA_MAX_MARKS } from '../constants';
import { generateCourseAnalysis } from '../services/geminiService';

// --- Reusable Icon Components ---
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.871 14.5A6.5 6.5 0 0112 4.02c2.613 0 4.936 1.531 6 3.737m-3.416 1.628A3.5 3.5 0 1112 15.5a3.5 3.5 0 012.584-5.835M9 12a3 3 0 116 0 3 3 0 01-6 0z" />
  </svg>
);

const StarIcon: React.FC<{ filled: boolean; className?: string }> = ({ filled, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


// --- Helper Functions ---
const calculateTotalCA = (course: Course): number => {
  return Object.values(course.ca).reduce((sum, score) => sum + (score ?? 0), 0);
};

const calculateCAPercentage = (course: Course): number => {
    const completedAssessments = Object.keys(course.ca).filter(
        key => course.ca[key as keyof typeof course.ca] !== null
    ) as (keyof typeof course.ca)[];

    if (completedAssessments.length === 0) return 0;

    const totalMaxCAForCompleted = completedAssessments.reduce(
        (sum, key) => sum + CA_MAX_MARKS[key],
        0
    );

    if (totalMaxCAForCompleted === 0) return 0;
    
    const currentCAMarks = calculateTotalCA(course);
    return (currentCAMarks / totalMaxCAForCompleted) * 100;
};


// --- Sub-Components ---

const StarRatingDisplay: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <StarIcon key={i} filled={i < rating} className={i < rating ? 'text-amber-400' : 'text-gray-600'} />
        ))}
    </div>
);


const CourseCard: React.FC<{ course: Course; onSelect: (course: Course) => void; style: React.CSSProperties }> = ({ course, onSelect, style }) => {
    const caPercentage = calculateCAPercentage(course);
    const totalCA = calculateTotalCA(course);
    const totalMaxCA = Object.values(CA_MAX_MARKS).reduce((a, b) => a + b, 0);
  
    let progressColor = 'bg-blue-500';
    if(caPercentage >= 80) progressColor = 'bg-green-500';
    else if(caPercentage >= 60) progressColor = 'bg-yellow-500';
    else progressColor = 'bg-red-500';

    return (
        <div
            onClick={() => onSelect(course)}
            style={style}
            className={`p-6 rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm shadow-lg cursor-pointer transition-all duration-300 transform hover:-translate-y-2 hover:border-indigo-500 card-enter-active`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-indigo-400 font-semibold">{course.code}</p>
                    <h3 className="text-xl font-bold text-white mt-1">{course.name}</h3>
                </div>
                <div className="text-right">
                    <p className="text-gray-400 text-sm">Target</p>
                    <p className="text-2xl font-bold text-white">{course.targetGrade}</p>
                </div>
            </div>

            <div className="mt-4 mb-6">
                <StarRatingDisplay rating={course.difficulty} />
            </div>
            
            <div>
                <div className="flex justify-between items-center text-sm text-gray-300 mb-2">
                    <span>C.A. Progress</span>
                    <span>{totalCA} / {totalMaxCA}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className={progressColor + " h-2.5 rounded-full"} style={{ width: `${caPercentage}%` }}></div>
                </div>
            </div>
        </div>
    );
};


const StarRatingInput: React.FC<{ rating: number; setRating: (rating: number) => void }> = ({ rating, setRating }) => {
    const [hoverRating, setHoverRating] = useState(0);
    return (
        <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => {
                const currentRating = i + 1;
                return (
                    <label key={i}>
                        <input
                            type="radio"
                            name="rating"
                            value={currentRating}
                            onChange={() => setRating(currentRating)}
                            className="sr-only"
                        />
                        <div
                            onMouseEnter={() => setHoverRating(currentRating)}
                            onMouseLeave={() => setHoverRating(0)}
                        >
                            <StarIcon
                                filled={currentRating <= (hoverRating || rating)}
                                className={`cursor-pointer transition-colors ${currentRating <= (hoverRating || rating) ? 'text-amber-400' : 'text-gray-600 hover:text-gray-500'}`}
                            />
                        </div>
                    </label>
                );
            })}
        </div>
    );
};


const AddCourseModal: React.FC<{ onAdd: (name: string, code: string, difficulty: number) => void; onClose: () => void }> = ({ onAdd, onClose }) => {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [difficulty, setDifficulty] = useState(3);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && code) {
            onAdd(name, code, difficulty);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 modal-backdrop-enter-active">
            <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-xl border border-gray-700 modal-content-enter-active">
                <h2 className="text-2xl font-bold text-white mb-6">Add New Course</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Course Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} type="text" className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder="e.g., Introduction to AI" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Course Code</label>
                        <input value={code} onChange={e => setCode(e.target.value)} type="text" className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder="e.g., CS101" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Perceived Difficulty</label>
                        <StarRatingInput rating={difficulty} setRating={setDifficulty} />
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition">Cancel</button>
                        <button type="submit" className="px-6 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition">Add Course</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AnalysisModal: React.FC<{ analysis: GeminiAnalysis; onClose: () => void }> = ({ analysis, onClose }) => {
    const getLikelihoodColor = (likelihood: string) => {
        switch (likelihood.toLowerCase()) {
            case 'high': return 'text-green-400';
            case 'medium': return 'text-yellow-400';
            case 'low': return 'text-orange-400';
            case 'very low': return 'text-red-500';
            default: return 'text-gray-300';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 modal-backdrop-enter-active">
            <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-3xl shadow-xl border border-gray-700 max-h-[90vh] overflow-y-auto modal-content-enter-active">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-indigo-400 flex items-center gap-3">
                        <BrainIcon /> AI Analysis
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl font-light">&times;</button>
                </div>

                <div className="bg-gray-900/50 p-6 rounded-lg mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Overall Summary</h3>
                    <p className="text-gray-300">{analysis.overallSummary}</p>
                </div>
                
                {analysis.priorityCourses.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold text-white mb-3">Priority Courses</h3>
                        <div className="space-y-3">
                            {analysis.priorityCourses.map((p, i) => (
                                <div key={i} className="bg-yellow-900/30 border border-yellow-700/50 p-4 rounded-lg">
                                    <h4 className="font-bold text-yellow-300">{p.courseName}</h4>
                                    <p className="text-yellow-200 text-sm">{p.reason}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Detailed Breakdown</h3>
                    <div className="space-y-4">
                        {analysis.courseAnalyses.map((c, i) => (
                            <div key={i} className="bg-gray-700/50 p-4 rounded-lg">
                                <h4 className="text-lg font-bold text-white">{c.courseName}</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                                    <div><span className="text-gray-400 block">Current CA</span><span className="font-semibold text-lg">{c.currentCA}</span></div>
                                    <div><span className="text-gray-400 block">Target Grade</span><span className="font-semibold text-lg">{c.targetGrade}</span></div>
                                    <div><span className="text-gray-400 block">Exam Score Needed</span><span className="font-semibold text-lg">{c.requiredExamScoreForTarget > 60 || c.requiredExamScoreForTarget < 0 ? 'N/A' : c.requiredExamScoreForTarget}</span></div>
                                    <div><span className="text-gray-400 block">Likelihood</span><span className={`font-semibold text-lg ${getLikelihoodColor(c.likelihood)}`}>{c.likelihood}</span></div>
                                </div>
                                <p className="text-gray-300 mt-3 text-sm italic">"{c.advice}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main Dashboard Component ---

interface DashboardProps {
  user: FirebaseUser;
  courses: Course[];
  isLoading: boolean;
  onSelectCourse: (course: Course) => void;
  onAddCourse: (name: string, code: string, difficulty: number) => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, courses, isLoading, onSelectCourse, onAddCourse, onLogout }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  const handleAddCourse = (name: string, code: string, difficulty: number) => {
    onAddCourse(name, code, difficulty);
    setShowAddModal(false);
  };

  const handleGetAnalysis = async () => {
    setIsLoadingAnalysis(true);
    setAnalysisResult(null);
    const result = await generateCourseAnalysis(courses);
    if (result) {
        setAnalysisResult(result);
        setShowAnalysisModal(true);
    }
    setIsLoadingAnalysis(false);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-grow">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Welcome!</h1>
            <p className="text-gray-400 mt-1 truncate">{user.email}</p>
          </div>
          <button onClick={onLogout} className="px-4 py-2 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 transition">Logout</button>
        </header>

        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-8">
          <button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 transform hover:scale-105">
            <PlusIcon />
            Add Course
          </button>
          <button
            onClick={handleGetAnalysis}
            disabled={isLoadingAnalysis || courses.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoadingAnalysis ? <Spinner /> : <BrainIcon />}
            {isLoadingAnalysis ? 'Analyzing...' : 'Get AI Analysis'}
          </button>
        </div>
        
        {isLoading ? (
            <div className="flex justify-center items-center py-20">
                <Spinner />
            </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <CourseCard key={course.id} course={course} onSelect={onSelectCourse} style={{ animationDelay: `${index * 100}ms` }} />
            ))}
          </div>
        ) : (
            <div className="text-center py-20 bg-gray-800/50 rounded-2xl border border-dashed border-gray-700">
                <h2 className="text-2xl font-semibold text-gray-300">No Courses Yet</h2>
                <p className="text-gray-500 mt-2">Click "Add Course" to get started.</p>
            </div>
        )}
      </div>

      <footer className="text-center text-gray-500 text-sm py-4 mt-8">
        By Kobi Oguadinma
      </footer>

      {showAddModal && <AddCourseModal onAdd={handleAddCourse} onClose={() => setShowAddModal(false)} />}
      {showAnalysisModal && analysisResult && <AnalysisModal analysis={analysisResult} onClose={() => setShowAnalysisModal(false)} />}
    </div>
  );
};

export default Dashboard;