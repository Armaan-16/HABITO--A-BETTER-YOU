import { GoogleGenAI, Type } from "@google/genai";
import { ScheduleItem } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const modelName = "gemini-2.5-flash";

export const generateAiSchedule = async (userFocus: string, date: string): Promise<ScheduleItem[]> => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Create a productive daily schedule for someone focusing on: "${userFocus}". 
      Date: ${date}.
      Fill hours from 06:00 (6 AM) to 22:00 (10 PM).
      Provide a specific activity for each hour block.
      Keep descriptions concise (max 5 words).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              hour: { type: Type.INTEGER, description: "Hour of the day 0-23" },
              activity: { type: Type.STRING },
              category: { type: Type.STRING, description: "One of: work, health, rest, focus, other" }
            },
            required: ["hour", "activity", "category"]
          }
        }
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) return [];
    
    const rawData = JSON.parse(jsonStr);
    
    return rawData.map((item: any) => ({
      id: `ai-${item.hour}-${Date.now()}`,
      hour: item.hour,
      activity: item.activity,
      completed: false,
      category: item.category
    }));

  } catch (error) {
    console.error("Gemini Schedule Error:", error);
    return [];
  }
};

export const getAiInsight = async (completedCount: number, totalCount: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `User completed ${completedCount} out of ${totalCount} habits today. 
      Give a very short, punchy, 1-sentence motivational quote or insight.`,
    });
    return response.text || "Keep pushing forward.";
  } catch (error) {
    return "Consistency is the key to mastery.";
  }
};
