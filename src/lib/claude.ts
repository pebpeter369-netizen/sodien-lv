import { GoogleGenAI } from "@google/genai";

let _client: GoogleGenAI | null = null;

export function getAIClient(): GoogleGenAI {
  if (!_client) {
    _client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  return _client;
}

export async function generateContent(
  systemPrompt: string,
  userPrompt: string,
  model: string = "gemini-2.5-flash"
): Promise<string> {
  const ai = getAIClient();

  const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

  const response = await ai.models.generateContent({
    model: `models/${model}`,
    contents: [
      {
        role: "user",
        parts: [{ text: combinedPrompt }],
      },
    ],
  });

  const text = response.text;
  if (!text) {
    throw new Error("No text response from Gemini");
  }

  return text;
}
