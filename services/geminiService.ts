import { GoogleGenAI, Type } from "@google/genai";
import { ScheduleItem } from '../types';

const modelName = "gemini-3-flash-preview";

export const generateAiSchedule = async (userFocus: string, date: string): Promise<ScheduleItem[]> => {
  try {
    // Initialize inside the function to avoid top-level failures if env var is missing at load time
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
        console.error("Gemini API Key is missing. Check your environment variables.");
        return [];
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Create a productive daily schedule for someone focusing on: "${userFocus}". 
      Date: ${date}.
      Fill hours from 06:00 (6 AM) to 22:00 (10 PM).
      Provide a specific activity for each hour block.
      Keep descriptions concise (max 5 words).
      Return a JSON object with a "schedule" property containing the array of items.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            schedule: {
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
        }
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) {
        console.warn("Gemini returned empty response text");
        return [];
    }
    
    let rawData;
    try {
        rawData = JSON.parse(jsonStr);
    } catch (parseError) {
        console.error("Failed to parse Gemini JSON response:", parseError);
        return [];
    }
    
    // Handle wrapped response (preferred) or fallback to root array
    const scheduleArray = rawData.schedule || (Array.isArray(rawData) ? rawData : []);
    
    if (!Array.isArray(scheduleArray)) {
        console.warn("Gemini response format unexpected:", rawData);
        return [];
    }

    return scheduleArray.map((item: any) => ({
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
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return "Consistency is key. (API Key missing)";
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: `User completed ${completedCount} out of ${totalCount} habits today. 
      Give a very short, punchy, 1-sentence motivational quote or insight.`,
    });
    return response.text || "Keep pushing forward.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Consistency is the key to mastery.";
  }
};