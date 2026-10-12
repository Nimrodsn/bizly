import { createOpenAIProvider } from "@/lib/ai/providers/openai";

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

export type DocumentExtractionResult = {
  supplier?: string;
  date?: string;
  totalAmount?: number;
  currency?: string;
  vatAmount?: number;
  invoiceNumber?: string;
  description?: string;
  category?: string;
  paymentMethod?: string;
  confidence: number;
  fieldConfidence?: Record<string, number>;
};

export interface AIProvider {
  chat(messages: ChatMessage[], tools?: unknown[]): Promise<{ content: string; toolCalls?: unknown[] }>;
  extractDocument(input: {
    mimeType: string;
    base64: string;
  }): Promise<DocumentExtractionResult>;
  classifyExpense(input: { description: string; amount?: number }): Promise<{ category?: string; supplier?: string }>;
  analyzeFinancialData(prompt: string): Promise<string>;
}

export function getAIProvider(): AIProvider | null {
  const provider = process.env.AI_PROVIDER;
  const apiKey = process.env.AI_API_KEY;
  if (!provider || !apiKey) return null;

  if (provider === "openai") {
    return createOpenAIProvider(apiKey, process.env.AI_MODEL ?? "gpt-4o-mini");
  }
  return null;
}
