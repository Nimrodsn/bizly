import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasAdminClient, createAdminClient } from "@/lib/supabase/admin";

const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!business) return NextResponse.json({ error: "No business" }, { status: 400 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const year = new Date().getFullYear();
  const docId = crypto.randomUUID();
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${user.id}/${business.id}/${year}/${docId}/original.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageClient = hasAdminClient() ? createAdminClient().storage : supabase.storage;
  const { error: uploadError } = await storageClient
    .from("business-documents")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data: doc, error } = await supabase
    .from("documents")
    .insert({
      id: docId,
      business_id: business.id,
      user_id: user.id,
      file_path: path,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      document_type: "other",
    })
    .select("id")
    .single();

  if (error || !doc) return NextResponse.json({ error: "DB error" }, { status: 500 });
  return NextResponse.json({ documentId: doc.id });
}
