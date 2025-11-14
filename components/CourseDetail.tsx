import React, { useState, useEffect } from 'react';
import type { Course, Grade } from '../types';
import { CA_MAX_MARKS, EXAM_MAX_MARKS, GRADES, GRADE_THRESHOLDS } from '../constants';

const StarIcon: React.FC<{ filled: boolean; className?: string }> = ({ filled, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

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
                                className={`cursor-pointer transition-colors h-6 w-6 ${currentRating <= (hoverRating || rating) ? 'text-amber-400' : 'text-gray-600 hover:text-gray-500'}`}
                            />
                        </div>
                    </label>
                );
            })}
        </div>
    );
};


interface CourseDetailProps {
  course: Course;
  onSave: (updatedCourse: Course) => void;
  onBack: () => void;
  onDelete: (courseId: string) => void;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ course, onSave, onBack, onDelete }) => {
  const [editedCourse, setEditedCourse] = useState<Course>(course);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setEditedCourse(course);
  }, [course]);

  const handleCAChange = (field: keyof Course['ca'], value: string) => {
    if (value === '') {
        setEditedCourse(prev => ({
            ...prev,
            ca: { ...prev.ca, [field]: null }
        }));
        return;
    }
    const numValue = parseInt(value, 10);
    const max = CA_MAX_MARKS[field];
    const score = isNaN(numValue) ? null : Math.max(0, Math.min(numValue, max));

    setEditedCourse(prev => ({
      ...prev,
      ca: { ...prev.ca, [field]: score }
    }));
  };

  const handleTargetGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditedCourse(prev => ({
      ...prev,
      targetGrade: e.target.value as Grade
    }));
  };

  const handleDifficultyChange = (rating: number) => {
    setEditedCourse(prev => ({ ...prev, difficulty: rating }));
  };
  
  const handleSaveChanges = () => {
    onSave(editedCourse);
  };
  
  const handleDelete = () => {
    onDelete(course.id);
  };

  const totalCA = Object.values(editedCourse.ca).reduce((a, b) => a + (b ?? 0), 0);
  const totalMaxCA = Object.values(CA_MAX_MARKS).reduce((a, b) => a + b, 0);

  const calculateRequiredExamScore = (grade: Grade): number => {
    const requiredTotal = GRADE_THRESHOLDS[grade];
    return requiredTotal - totalCA;
  };

  const renderGradeRow = (grade: Grade) => {
    const requiredScore = calculateRequiredExamScore(grade);
    const isPossible = requiredScore <= EXAM_MAX_MARKS && requiredScore >= 0;
    const isTarget = editedCourse.targetGrade === grade;

    return (
        <tr key={grade} className={`border-b border-gray-700 ${isTarget ? 'bg-indigo-900/50' : ''}`}>
            <td className="p-4 font-bold">{grade} ({GRADE_THRESHOLDS[grade]}+)</td>
            <td className={`p-4 font-semibold ${isPossible ? 'text-green-400' : 'text-red-500'}`}>
                {requiredScore} / {EXAM_MAX_MARKS}
            </td>
            <td className={`p-4 font-semibold ${isPossible ? 'text-green-400' : 'text-red-500'}`}>
                {isPossible ? 'Achievable' : 'Impossible'}
            </td>
        </tr>
    );
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-6 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </button>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between md:items-start mb-8">
            <div>
                <p className="text-indigo-400 font-semibold">{editedCourse.code}</p>
                <h1 className="text-3xl md:text-4xl font-bold">{editedCourse.name}</h1>
            </div>
            <div className="flex flex-col items-start md:items-end gap-4 mt-4 md:mt-0">
                <div className="flex items-center gap-4">
                  <label htmlFor="targetGrade" className="text-gray-300">Target:</label>
                  <select id="targetGrade" value={editedCourse.targetGrade} onChange={handleTargetGradeChange} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-lg font-bold">
                      {GRADES.map(g => g !== 'F' && <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-gray-300">Difficulty:</label>
                  <StarRatingInput rating={editedCourse.difficulty} setRating={handleDifficultyChange} />
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Continuous Assessment</h2>
              <div className="space-y-4">
                {Object.keys(CA_MAX_MARKS).map(key => {
                  const fieldKey = key as keyof typeof CA_MAX_MARKS;
                  return (
                    <div key={fieldKey} className="flex items-center justify-between">
                      <label className="capitalize text-gray-300">{fieldKey.replace(/([A-Z])/g, ' $1')}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editedCourse.ca[fieldKey] ?? ''}
                          onChange={(e) => handleCAChange(fieldKey, e.target.value)}
                          className="w-20 bg-gray-700 text-white text-center rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="-"
                        />
                        <span className="text-gray-500">/ {CA_MAX_MARKS[fieldKey]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between items-center">
                  <span className="text-lg font-bold">Total C.A.</span>
                  <span className="text-2xl font-bold text-indigo-400">{totalCA} / {totalMaxCA}</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Exam Target Analysis</h2>
              <table className="w-full text-left">
                <thead className="text-sm text-gray-400">
                  <tr>
                    <th className="p-2">Grade</th>
                    <th className="p-2">Required Score</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                    {GRADES.filter(g => g !== 'F').map(renderGradeRow)}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-gray-700">
            <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto order-2 sm:order-1 mt-4 sm:mt-0 px-6 py-2 text-sm text-red-400 bg-red-900/30 hover:bg-red-900/60 rounded-lg transition"
            >
              Delete Course
            </button>
            <button onClick={handleSaveChanges} className="w-full sm:w-auto order-1 sm:order-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition">
              Save Changes
            </button>
          </div>
        </div>
        
        {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 modal-backdrop-enter-active">
                <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-xl border border-gray-700 modal-content-enter-active">
                    <h3 className="text-xl font-bold text-white mb-4">Confirm Deletion</h3>
                    <p className="text-gray-300 mb-6">Are you sure you want to delete "{course.name}"? This action cannot be undone.</p>
                    <div className="flex justify-end space-x-4">
                        <button onClick={() => setShowDeleteConfirm(false)} className="px-6 py-2 rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition">Cancel</button>
                        <button onClick={handleDelete} className="px-6 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition">Delete</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;