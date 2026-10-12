import { NextResponse } from "next/server";
import { runAssistant } from "@/lib/ai/assistant";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as { message?: string };
    if (!body.message?.trim()) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const result = await runAssistant(body.message);
    await supabase.from("ai_usage").insert({
      user_id: user.id,
      provider: process.env.AI_PROVIDER ?? "none",
      model: process.env.AI_MODEL,
      feature: "chat",
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "לא ניתן לענות כרגע." }, { status: 500 });
  }
}
