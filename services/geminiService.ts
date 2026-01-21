
import { GoogleGenAI, Type } from "@google/genai";
import { MathResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const solveAdvancedMath = async (query: string, category: string): Promise<MathResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Task: Solve the following ${category} math problem. 
    Problem: ${query}
    Provide the result in a JSON format including the final value, a brief explanation, and step-by-step reasoning.
    If it's an ODE, provide the general solution and particular solution if initial conditions are given.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          value: { type: Type.STRING, description: "The final answer or expression" },
          explanation: { type: Type.STRING, description: "Brief overview of the method used" },
          steps: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of logical steps taken to reach the solution"
          },
          latex: { type: Type.STRING, description: "The result in LaTeX format for rendering" }
        },
        required: ["value", "explanation", "steps"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { value: response.text, explanation: "Error parsing structured response" };
  }
};
