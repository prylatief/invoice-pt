import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceItem } from "../types";

const AI_API_KEY = process.env.API_KEY;

// Parse invoice items from an image (receipt/invoice photo)
export const scanInvoiceImage = async (base64Image: string): Promise<InvoiceItem[]> => {
  if (!AI_API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  // Remove header from base64 string if present (data:image/jpeg;base64,...)
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  const ai = new GoogleGenAI({ apiKey: AI_API_KEY });
  
  const prompt = "Analyze this receipt/invoice image. Extract the line items. Return a list of items with description, quantity (default to 1 if missing), and price per unit (as a number, remove currency symbols). Ignore totals/subtotals, just get the items.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png", // Assuming PNG/JPEG, API handles standard types well
              data: cleanBase64
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              price: { type: Type.NUMBER }
            },
            required: ["description", "quantity", "price"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const items = JSON.parse(text);
    
    // Map to our internal structure with IDs
    return items.map((item: any) => ({
      id: crypto.randomUUID(),
      description: item.description,
      quantity: item.quantity || 1,
      price: item.price || 0
    }));

  } catch (error) {
    console.error("Gemini Scan Error:", error);
    throw error;
  }
};