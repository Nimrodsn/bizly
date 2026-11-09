import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReceiptPdf } from "@/lib/documents/receipt-pdf";
import { getOrCreateStoredPdf, toPdfData } from "@/lib/receipts/pdf-service";
import type { ReceiptRow } from "@/lib/receipts/constants";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const copy = url.searchParams.get("copy") === "1";
  const inline = url.searchParams.get("inline") === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: receipt } = await supabase.from("receipts").select("*").eq("id", id).maybeSingle();
  if (!receipt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const r = receipt as ReceiptRow;
  const { data: biz } = await supabase
    .from("businesses")
    .select("receipt_footer")
    .eq("id", r.business_id)
    .single();

  // Original = the stored immutable file. Copy = rendered on demand from the same snapshot.
  const bytes = copy
    ? await generateReceiptPdf(toPdfData(r, { copy: true, footer: biz?.receipt_footer }))
    : await getOrCreateStoredPdf(supabase, user.id, r, biz?.receipt_footer);

  const name = `receipt-${r.receipt_number}${copy ? "-copy" : ""}.pdf`;
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
