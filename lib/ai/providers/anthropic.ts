import type { AIProvider } from "@/lib/ai/provider";

/** Adapter stub — wire Anthropic Messages API when AI_PROVIDER=anthropic */
export function createAnthropicProvider(_apiKey: string, _model: string): AIProvider {
  throw new Error("Anthropic provider not configured in V1");
}
