import { GoogleGenAI, Type } from "@google/genai";
import type { Course, GeminiAnalysis } from "../types";
import { CA_MAX_MARKS, EXAM_MAX_MARKS, GRADE_THRESHOLDS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateCourseAnalysis = async (courses: Course[]): Promise<GeminiAnalysis | null> => {
  if (!process.env.API_KEY) {
    console.error("API key is missing.");
    alert("Gemini API key is not configured. Please set the API_KEY environment variable.");
    return null;
  }

  const courseDataForPrompt = courses.map(c => ({
    name: c.name,
    code: c.code,
    caScores: c.ca,
    targetGrade: c.targetGrade,
    perceivedDifficulty: c.difficulty,
  }));

  const prompt = `
    You are an expert academic advisor AI. Your goal is to analyze a student's course progress and provide actionable advice.
    
    Here is the student's data:
    - Maximum CA marks: Mid-Semester (${CA_MAX_MARKS.midSemester}), Assignment (${CA_MAX_MARKS.assignment}), Quiz (${CA_MAX_MARKS.quiz}), Attendance (${CA_MAX_MARKS.attendance}). Total CA is ${Object.values(CA_MAX_MARKS).reduce((a,b) => a+b, 0)}.
    - Maximum Exam marks: ${EXAM_MAX_MARKS}.
    - Total marks for a course: 100.
    - Grade thresholds: A >= ${GRADE_THRESHOLDS.A}, B >= ${GRADE_THRESHOLDS.B}, C >= ${GRADE_THRESHOLDS.C}, D >= ${GRADE_THRESHOLDS.D}.

    Student's course data:
    - Scores for CA components are provided as numbers.
    - A 'null' value for a CA component means the assessment has not been completed or graded yet.
    - 'perceivedDifficulty' is a self-reported score on a scale of 1-5 where 5 is hardest.
    ${JSON.stringify(courseDataForPrompt, null, 2)}

    Please perform the following analysis and return the result in the specified JSON format.
    1.  Write a brief, encouraging 'overallSummary' of the student's performance based on the assessments completed so far.
    2.  For each course, create an object in the 'courseAnalyses' array.
        - Calculate 'currentCA' as the sum of all their COMPLETED CA scores (ignore nulls).
        - Based on their performance in completed assessments, project their final CA score if possible. Then calculate the 'requiredExamScoreForTarget' needed to get their 'targetGrade'. If it's impossible (score > ${EXAM_MAX_MARKS} or < 0), state the calculated number.
        - Assess the 'likelihood' of achieving the target grade as 'High', 'Medium', 'Low', or 'Very Low'. CRITICAL: This likelihood must be heavily influenced by their performance so far, the 'requiredExamScoreForTarget' AND the student's 'perceivedDifficulty'. A high difficulty score should significantly lower the likelihood.
        - Provide brief, specific 'advice'. For courses with many upcoming assessments, advise on how to prepare.
    3.  Identify the top 1-3 'priorityCourses' that need the most attention and explain the 'reason', considering poor performance on completed work, high difficulty, and upcoming high-value assessments.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallSummary: { type: Type.STRING },
            courseAnalyses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  courseName: { type: Type.STRING },
                  currentCA: { type: Type.NUMBER },
                  targetGrade: { type: Type.STRING },
                  requiredExamScoreForTarget: { type: Type.NUMBER },
                  likelihood: { type: Type.STRING },
                  advice: { type: Type.STRING },
                },
                required: ["courseName", "currentCA", "targetGrade", "requiredExamScoreForTarget", "likelihood", "advice"]
              },
            },
            priorityCourses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  courseName: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ["courseName", "reason"]
              },
            },
          },
          required: ["overallSummary", "courseAnalyses", "priorityCourses"]
        },
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as GeminiAnalysis;

  } catch (error) {
    console.error("Error generating analysis from Gemini API:", error);
    alert("An error occurred while fetching analysis from Gemini. Please check the console for details.");
    return null;
  }
};