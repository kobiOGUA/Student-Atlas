export interface CA_Components {
  midSemester: number | null;
  assignment: number | null;
  quiz: number | null;
  attendance: number | null;
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface Course {
  id: string;
  name: string;
  code: string;
  ca: CA_Components;
  targetGrade: Grade;
  difficulty: number; // 1-5 scale
}

export interface User {
  uid: string;
  email: string | null;
}

export interface GeminiAnalysis {
  overallSummary: string;
  courseAnalyses: {
    courseName: string;
    currentCA: number;
    targetGrade: string;
    requiredExamScoreForTarget: number;
    likelihood: 'High' | 'Medium' | 'Low' | 'Very Low';
    advice: string;
  }[];
  priorityCourses: {
    courseName: string;
    reason: string;
  }[];
}