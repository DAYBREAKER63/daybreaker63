
import { GoogleGenAI, Type } from "@google/genai";
import { CheckIn, DietConfig } from "../types";

/**
 * Constructs the detailed prompt string for the behavioral evaluation.
 */
const constructPrompt = (checkIn: CheckIn, history: CheckIn[]): string => {
  const historyContext = history
    .slice(-5)
    .map((h) => `Date: ${h.date}, Score: ${h.score}`)
    .join("\n");

  return `
    Today's Data:
    - Phone away: ${checkIn.nightLog.phoneTime}
    - Screen use after 10PM: ${checkIn.nightLog.screenUse}
    - Content: ${checkIn.nightLog.contentType}
    - Sleep: ${checkIn.nightLog.sleepTime}
    - Resisted urge: ${checkIn.nightLog.resistedUrge}
    - Action: ${checkIn.nightLog.disciplinedAction}
    - Total Score: ${checkIn.score}

    History:
    ${historyContext || "No prior history recorded."}

    Evaluate behavior. Name gaps. Issue command.
  `;
};

/**
 * Evaluates user performance using Gemini AI.
 */
export const evaluatePerformance = async (
  checkIn: CheckIn,
  history: CheckIn[]
): Promise<CheckIn['aiFeedback']> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `You are an authoritative behavioral evaluator for a private user aged 16–25.
Your purpose is to build self-control, night discipline, and structured living.
You do not comfort, motivate emotionally, praise excessively, or shame.
You speak briefly, clearly, and with authority.

CORE RULES:
- Behavior matters more than intention.
- Consistency matters more than intensity.
- Comfort is irrelevant. Compliance matters.
- Lying or self-deception must be called out directly.

OUTPUT FORMAT (MANDATORY):
Observation: (Factual summary of behavior)
Interpretation: (Psychological meaning, naming avoidance or weakness)
Command: (ONE non-negotiable action for the next day/night)

You must return strictly JSON following this schema.`;

  const prompt = constructPrompt(checkIn, history);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Upgraded for complex reasoning
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            observation: { type: Type.STRING },
            interpretation: { type: Type.STRING },
            command: { type: Type.STRING },
          },
          required: ["observation", "interpretation", "command"],
        }
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Gemini Evaluation Error:", error);
    return {
      observation: "Data recorded.",
      interpretation: "System offline. Connection or protocol error detected.",
      command: "Maintain previous structure. Resolve environmental obstacles."
    };
  }
};

/**
 * Generates a diet plan using Google Search grounding.
 */
export const generateDietPlan = async (config: DietConfig) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `User Data: Age ${config.age}, Weight ${config.weight}kg, Height ${config.height}cm. Goal: ${config.goal === 'Gain' ? 'Muscle Gain / Bulking' : 'Fat Loss / Cutting'}.
  Using Google Search, find up-to-date and effective nutritional guidelines and meal plans for this specific profile.
  Provide a concise plan including:
  1. Estimated TDEE and the necessary calorie surplus/deficit.
  2. Meal structure (Breakfast, Lunch, Dinner, Snacks).
  3. Key nutritional rules to follow.
  Be direct, stoic, and authoritative. Avoid fluff. Include sources.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a clinical performance nutritionist for young men. You prioritize biology over feelings. Your advice is evidence-based and direct."
      },
    });

    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { text, sources };
  } catch (error) {
    console.error("Diet Generation Error:", error);
    throw error; // Let the caller handle UI state
  }
};
