import type { AIProvider, ChatMessage, DocumentExtractionResult } from "@/lib/ai/provider";

export function createOpenAIProvider(apiKey: string, model: string): AIProvider {
  return {
    async chat(messages: ChatMessage[]) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
        }),
      });
      if (!res.ok) throw new Error("AI request failed");
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return { content: json.choices?.[0]?.message?.content ?? "" };
    },

    async extractDocument(input): Promise<DocumentExtractionResult> {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "Extract receipt fields for Israeli business expense. Return JSON only with keys: supplier, date (YYYY-MM-DD), totalAmount, currency, vatAmount, invoiceNumber, description, category, paymentMethod, confidence (0-1), fieldConfidence object.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this document image.",
                },
                {
                  type: "image_url",
                  image_url: { url: `data:${input.mimeType};base64,${input.base64}` },
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) throw new Error("AI extraction failed");
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const raw = json.choices?.[0]?.message?.content ?? "{}";
      return JSON.parse(raw) as DocumentExtractionResult;
    },

    async classifyExpense(input) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "Suggest Hebrew expense category and supplier name. JSON: {category, supplier}",
            },
            { role: "user", content: input.description },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) return {};
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as {
        category?: string;
        supplier?: string;
      };
    },

    async analyzeFinancialData(prompt: string) {
      const { content } = await this.chat([
        { role: "system", content: "Answer in Hebrew based only on provided data." },
        { role: "user", content: prompt },
      ]);
      return content;
    },
  };
}
