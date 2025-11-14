import { db } from '../firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import type { Course } from '../types';

// The data sent to firestore should not include the id
type CourseData = Omit<Course, 'id'>;

// Path to a user's courses subcollection
const coursesCollectionRef = (userId: string) => collection(db, `users/${userId}/courses`);

/**
 * Fetches all courses for a specific user from Firestore.
 * @param userId - The UID of the user.
 * @returns A promise that resolves to an array of courses.
 */
export const getCourses = async (userId: string): Promise<Course[]> => {
  const q = query(coursesCollectionRef(userId), orderBy('name', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Course[];
};

/**
 * Adds a new course to a user's collection in Firestore.
 * @param userId - The UID of the user.
 * @param courseData - The course data to add (without an ID).
 * @returns A promise that resolves when the course is added.
 */
export const addCourse = async (userId: string, courseData: CourseData) => {
  await addDoc(coursesCollectionRef(userId), courseData);
};

/**
 * Updates an existing course in a user's collection in Firestore.
 * @param userId - The UID of the user.
 * @param courseId - The ID of the course document to update.
 * @param updatedData - An object containing the fields to update.
 * @returns A promise that resolves when the course is updated.
 */
export const updateCourse = async (userId: string, courseId: string, updatedData: Partial<CourseData>) => {
  const courseDoc = doc(db, `users/${userId}/courses`, courseId);
  await updateDoc(courseDoc, updatedData);
};

/**
 * Deletes a course from a user's collection in Firestore.
 * @param userId - The UID of the user.
 * @param courseId - The ID of the course document to delete.
 * @returns A promise that resolves when the course is deleted.
 */
export const deleteCourse = async (userId: string, courseId: string) => {
  const courseDoc = doc(db, `users/${userId}/courses`, courseId);
  await deleteDoc(courseDoc);
};
