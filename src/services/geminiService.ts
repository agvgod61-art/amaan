import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function chatWithGemini(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[], context: string, siteName: string = "AVG GOD") {
  try {
    const model = "gemini-3-flash-preview";
    
    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history,
        { role: 'user', parts: [{ text: `Context about the store (Products, Policies, Sizing): ${context}\n\nUser Question: ${message}` }] }
      ],
      config: {
        systemInstruction: `You are a helpful customer support assistant for ${siteName}, a premium riding gear store.
        
Your communication rules:
1. MANDATORY: If a user asks for product recommendations, YOU MUST NOT suggest products immediately. Instead, you MUST first ask for their:
   - Bike Type (e.g., Sports, Naked, Cruiser, Tourer)
   - Riding Style (e.g., Daily commute, Track days, Weekend touring)
Only after they provide these details should you use the product catalog in the context to recommend 2-3 specific models that fit their needs.

2. Provide step-by-step guidance for purchasing products when asked.
3. Clearly explain how to contact customer service (WhatsApp is preferred).
4. Use the provided context (Products, Policies, Sizing, Guides) to answer accurately.
5. Be professional, concise, and helpful. If you don't know the answer, suggest contacting support directly via WhatsApp (+91 8292908076).`,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I encountered an error. Please try again later.";
  }
}
