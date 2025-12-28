import { GoogleGenAI, Type } from "@google/genai";
import { ScheduleItem } from '../types';

const modelName = "gemini-3-flash-preview";

export const generateAiSchedule = async (userFocus: string, date: string): Promise<ScheduleItem[]> => {
  try {
    // Vite replaces process.env.API_KEY with the actual string value during build.
    // We check for various "empty" states to be safe.
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === "undefined" || apiKey.length === 0) {
        console.error("Gemini API Key is missing. Ensure the API_KEY environment variable is set in your Netlify deployment settings.");
        return [];
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: `
      Act as a smart daily planner.
      User's Request: "${userFocus}". 
      Date: ${date}.

      Task: Generate a JSON schedule for the entire day (Hours 0 to 23).
      
      CRITICAL SLEEP LOGIC:
      1. Analyze the user's request for sleep/wake times (e.g., "sleep at 10", "wake up at 6").
         - If they say "sleep at 10" (or 10pm), marks hours 22 and 23 as activity "Sleep" (category: "rest").
         - If they say "wake up at 6" (or 6am), marks hours 0, 1, 2, 3, 4, 5 as activity "Sleep" (category: "rest").
         - Ensure the ENTIRE block between sleep time and wake time is filled with "Sleep".
      2. If no sleep time is mentioned, assume a standard cycle (e.g., Sleep 23:00-07:00).
      3. For all WAKING hours, create specific, productive activities matching the user's focus.
      
      Constraints:
      - Activity descriptions must be concise (max 5 words).
      - Return a JSON object with a "schedule" property containing the array.
      `,
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

    let jsonStr = response.text;
    if (!jsonStr) {
        console.warn("Gemini returned empty response text");
        return [];
    }
    
    // Robust cleanup: Remove Markdown code blocks if the model includes them
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let rawData;
    try {
        rawData = JSON.parse(jsonStr);
    } catch (parseError) {
        console.error("Failed to parse Gemini JSON response. Raw text:", jsonStr, parseError);
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
    if (!apiKey || apiKey === "undefined") {
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