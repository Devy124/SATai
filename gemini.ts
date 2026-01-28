import { GoogleGenAI, Type } from "@google/genai";
import { Question } from '../types';

// Hardcoded key as requested
const API_KEY = "AIzaSyBoOi92EA-8ZFNTD5yEE1b5q21umj6NYzQ";

const getAiClient = (): GoogleGenAI => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

export const explainQuestion = async (question: Question): Promise<string> => {
  const ai = getAiClient();
  
  try {
    const prompt = `
      You are an expert SAT tutor. Provide a comprehensive explanation for the following question.
      
      Structure your response clearly with these sections (use bolding for headers):
      
      **1. Core Concept**
      Briefly identify the rule or skill being tested.

      **2. Step-by-Step Solution**
      Clear, logical steps to arrive at the correct answer.

      **3. Common Pitfalls**
      Explain why the most plausible distractor is wrong.

      Question: "${question.q}"
      Options: ${question.a.join(', ')}
      Correct Answer: "${question.a[question.correct]}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "No explanation available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to fetch AI explanation.";
  }
};

const generateBatch = async (subject: string, difficulty: string, count: number): Promise<Question[]> => {
  const ai = getAiClient();

  const subjectPrompts: Record<string, string> = {
    math: `Focus on "Heart of Algebra", "Problem Solving and Data Analysis", "Passport to Advanced Math".
           - Include a mix of word problems and equation solving.
           - Ensure incorrect answers are plausible.`,
    english: `Focus on "Standard English Conventions" and "Expression of Ideas".
              - Include questions on grammar, punctuation, and vocabulary in context.`
  };

  const difficultyPrompts: Record<string, string> = {
    easy: "Questions should test core concepts directly.",
    medium: "Questions should require combining multiple concepts.",
    hard: "Questions should be challenging, involving complex logic."
  };

  const prompt = `
    Generate ${count} unique, high-quality SAT practice questions for ${subject} at a ${difficulty} difficulty level.
    
    Strict Design Rules:
    1. **Format**: Multiple-choice with exactly 4 options.
    2. **Variety**: PENALIZE repetition.
    3. **Complexity**: Mirror Digital SAT style.
    
    Subject Guidelines:
    ${subjectPrompts[subject] || ""}
    
    Difficulty Guidelines:
    ${difficultyPrompts[difficulty] || ""}
    
    Output Format:
    Return strictly a JSON array of objects matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              q: { type: Type.STRING },
              a: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              },
              correct: { type: Type.INTEGER }
            },
            required: ["q", "a", "correct"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Question[];
    }
    return [];
  } catch (error) {
    console.error("Batch generation failed:", error);
    return [];
  }
};

export const generateQuestions = async (subject: string, difficulty: string, count: number = 5): Promise<Question[]> => {
  const ai = getAiClient();

  // Optimize by running parallel requests
  const BATCH_SIZE = 5;
  const promises: Promise<Question[]>[] = [];
  
  for (let i = 0; i < count; i += BATCH_SIZE) {
    const size = Math.min(BATCH_SIZE, count - i);
    promises.push(generateBatch(subject, difficulty, size));
  }

  try {
    const results = await Promise.all(promises);
    return results.flat();
  } catch (error) {
    console.error("Failed to generate questions:", error);
    return [];
  }
};