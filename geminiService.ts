import { GoogleGenAI, Type } from "@google/genai";
import { Question } from '../types';
import { QUESTIONS_PER_LEVEL, LEVEL_DESCRIPTIONS } from '../constants';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: {
        type: Type.STRING,
        description: "The maths question text. Should be a word problem or calculation."
      },
      answer: {
        type: Type.NUMBER,
        description: "The numerical answer to the question. Must be a single number."
      }
    },
    required: ["question", "answer"]
  }
};

export const generateMathsQuestions = async (level: number): Promise<Question[]> => {
  try {
    const levelDescription = LEVEL_DESCRIPTIONS[level] || "general maths problems";

    const prompt = `You are a fun and engaging maths quiz master for 12-year-old students in the UK (Year 7/8 curriculum). 
    Generate ${QUESTIONS_PER_LEVEL} unique maths problems for Level ${level}.
    The topics for this level should focus on: ${levelDescription}.
    The questions should be worded clearly and concisely.
    The answer MUST be a single numerical value, without any units or text.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 1, // Be creative with the questions
      },
    });

    const jsonText = response.text.trim();
    const questions = JSON.parse(jsonText) as Question[];
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new Error("API returned an invalid or empty list of questions.");
    }
    
    // Validate that questions have the required fields
    return questions.filter(q => q.question && typeof q.answer === 'number');

  } catch (error) {
    console.error("Error generating maths questions:", error);
    throw new Error("Could not fetch maths questions from Gemini. Please check your API key and try again.");
  }
};
