import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SensorData {
  humidity: number;
  waterPresence: boolean;
  temperature: number;
  locationName: string;
}

export async function getLeakAssessment(data: SensorData) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze the following water sensor data for a property location:
    Location: ${data.locationName}
    Humidity: ${data.humidity}%
    Water Detected: ${data.waterPresence ? "YES" : "NO"}
    Temperature: ${data.temperature}°C

    Provide a concise assessment of the situation. 
    If a leak is detected (Water Detected is YES), provide a prioritized, location-specific emergency checklist.
    If no leak is detected but humidity is high (>65%), provide preventative advice.
    Keep the tone professional and urgent if necessary.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert water damage mitigation assistant. Provide concise, actionable advice for property owners.",
      }
    });

    return response.text || "Unable to generate assessment at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI intelligence service.";
  }
}
