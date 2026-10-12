import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai/provider";
import { hasAdminClient, createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId } = (await request.json()) as { documentId?: string };
  if (!documentId) return NextResponse.json({ error: "Missing documentId" }, { status: 400 });

  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const provider = getAIProvider();
  if (!provider) {
    return NextResponse.json({
      extraction: {
        description: "AI לא מוגדר — הזן נתונים ידנית",
        confidence: 0,
      },
    });
  }

  const storageClient = hasAdminClient() ? createAdminClient().storage : supabase.storage;
  const { data: fileData, error: dlError } = await storageClient
    .from("business-documents")
    .download(doc.file_path);
  if (dlError || !fileData) {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const base64 = buffer.toString("base64");
  const extraction = await provider.extractDocument({ mimeType: doc.mime_type, base64 });

  await supabase
    .from("documents")
    .update({
      ai_extraction_status: "completed",
      metadata_json: extraction,
    })
    .eq("id", documentId);

  return NextResponse.json({ extraction });
}
