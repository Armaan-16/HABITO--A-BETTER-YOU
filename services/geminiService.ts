import { GoogleGenAI, Type } from "@google/genai";
import { ScheduleItem } from '../types';

const modelName = "gemini-3-flash-preview";

export const generateAiSchedule = async (userFocus: string, date: string): Promise<ScheduleItem[]> => {
  // Vite replaces process.env.API_KEY with the actual string value during build.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey.length === 0) {
      throw new Error("Gemini API Key is missing. Please set the API_KEY environment variable in your Netlify settings or local .env file.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `
      Act as a smart daily planner.
      User's Request: "${userFocus}". 
      Date: ${date}.

      Task: Generate a JSON schedule for the entire day (Hours 0 to 23).
      
      CRITICAL INSTRUCTIONS:
      1. Analyze the user's request. If the request is vague, nonsense (e.g., "fgdd", "asdf"), too short, or empty, IGNORE the text and generate a generic, balanced, high-productivity schedule for a healthy individual (e.g., Sleep 23-07, Work 09-17, Exercise, etc.).
      2. SLEEP LOGIC:
         - If user specifies sleep/wake times, fill those hours with "Sleep" (category: "rest").
         - Otherwise, assume standard sleep (23:00 to 07:00).
      3. Fill ALL 24 hours (0-23).
      
      Constraints:
      - Activity descriptions must be concise (max 5 words).
      - Category must be exactly one of: 'work', 'health', 'rest', 'focus', 'other'.
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
                  category: { type: Type.STRING, description: "work, health, rest, focus, other" }
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
        throw new Error("Gemini returned an empty response.");
    }
    
    // Cleanup potential markdown blocks if the model ignores MIME type (rare but possible)
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let rawData;
    try {
        rawData = JSON.parse(jsonStr);
    } catch (parseError) {
        console.error("JSON Parse Error:", jsonStr);
        throw new Error("Failed to parse AI response. Please try again.");
    }
    
    const scheduleArray = rawData.schedule || (Array.isArray(rawData) ? rawData : []);
    
    if (!Array.isArray(scheduleArray) || scheduleArray.length === 0) {
        throw new Error("AI returned an invalid schedule format.");
    }

    // Map and sanitize the response
    return scheduleArray.map((item: any) => ({
      id: `ai-${item.hour}-${Date.now()}`,
      hour: item.hour,
      activity: item.activity || "Free Time",
      completed: false,
      category: ['work', 'health', 'rest', 'focus', 'other'].includes(item.category?.toLowerCase()) 
        ? item.category.toLowerCase() 
        : 'other'
    }));

  } catch (error: any) {
    console.error("Gemini Schedule Error:", error);
    
    // Provide clearer error messages for common issues
    if (error.message.includes("403") || error.message.includes("API key")) {
        throw new Error("Invalid API Key or Quota Exceeded. Please check your Netlify environment variables.");
    }
    if (error.message.includes("429")) {
        throw new Error("API Quota Exceeded. Please try again later.");
    }
    
    throw error;
  }
};

export const getAiInsight = async (completedCount: number, totalCount: number): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === "undefined") return "Consistency is key.";

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