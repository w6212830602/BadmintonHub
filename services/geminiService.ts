import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getBadmintonTips = async (
  stats: { won: number; played: number; form: string[] },
  matches: any[]
): Promise<string[]> => {
  try {
    const recentMatchesStr = matches
      .slice(0, 5)
      .map(m => `Score: ${m.scoreA}-${m.scoreB} (Result: ${m.result})`)
      .join('\n');

    const prompt = `
      You are an expert badminton coach. Analyze this player's stats:
      - Win Rate: ${Math.round((stats.won / (stats.played || 1)) * 100)}%
      - Recent Form: ${stats.form.join('-')}
      - Recent Match Details:
      ${recentMatchesStr}

      Provide exactly 3 short, actionable, and encouraging coaching tips to improve their game. 
      Format as a JSON string array. Example: ["Tip 1", "Tip 2", "Tip 3"]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return ["Keep practicing your footwork!", "Focus on consistency.", "Analyze your opponents weak points."];
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback if API fails
    return [
      "Focus on recovering to the center after every shot.",
      "Keep your racket up and ready at all times.",
      "Vary your service to keep opponents guessing."
    ];
  }
};