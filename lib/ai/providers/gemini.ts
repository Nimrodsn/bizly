import type { AIProvider } from "@/lib/ai/provider";

/** Adapter stub — wire Google Gemini when AI_PROVIDER=gemini */
export function createGeminiProvider(_apiKey: string, _model: string): AIProvider {
  throw new Error("Gemini provider not configured in V1");
}
