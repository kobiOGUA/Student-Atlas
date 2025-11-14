
import type { Grade } from './types';

export const CA_MAX_MARKS = {
  midSemester: 15,
  assignment: 10,
  quiz: 10,
  attendance: 5,
};

export const EXAM_MAX_MARKS = 60;

export const GRADE_THRESHOLDS: Record<Grade, number> = {
  A: 80,
  B: 70,
  C: 60,
  D: 50,
  F: 0,
};

export const GRADES: Grade[] = ['A', 'B', 'C', 'D', 'F'];
