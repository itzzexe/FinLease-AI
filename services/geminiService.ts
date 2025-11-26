import { GoogleGenAI } from "@google/genai";
import { LeaseContract } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeLeaseContract = async (lease: LeaseContract): Promise<string> => {
  if (!apiKey) return "API Key not configured.";

  const prompt = `
    Act as a senior financial analyst specializing in IFRS 16 and ASC 842.
    Analyze the following lease contract data and provide a brief executive summary containing:
    1. Financial Impact (P&L and Balance Sheet).
    2. Key Risks (Interest rate sensitivity, foreign exchange if non-USD).
    3. Recommendations for optimization.
    
    Lease Data:
    - Asset: ${lease.assetName}
    - Term: ${lease.termMonths} months
    - Monthly Payment: ${lease.paymentAmount} ${lease.currency}
    - Discount Rate: ${lease.incrementalBorrowingRate}%
    - Standard: ${lease.standard}
    - Classification: ${lease.classification}
    
    Keep the response professional, concise, and formatted in Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Error generating analysis. Please check your network or API key.";
  }
};
