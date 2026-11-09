import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateReceiptPdf, type ReceiptPdfData } from "@/lib/documents/receipt-pdf";
import type { ReceiptRow } from "./constants";

export function formatDateDmy(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function toPdfData(r: ReceiptRow, opts: { copy?: boolean; footer?: string | null } = {}): ReceiptPdfData {
  return {
    receiptNumber: r.receipt_number,
    issueDate: formatDateDmy(r.issue_date),
    issuerName: r.issuer_name,
    issuerOwner: r.issuer_owner,
    issuerTaxId: r.issuer_tax_id,
    issuerAddress: r.issuer_address,
    issuerPhone: r.issuer_phone,
    issuerEmail: r.issuer_email,
    clientName: r.client_name,
    clientTaxId: r.client_tax_id,
    clientAddress: r.client_address,
    description: r.description,
    amount: Number(r.amount),
    paymentMethod: r.payment_method,
    paymentDetails: r.payment_details,
    footer: opts.footer,
    cancelled: r.status === "cancelled",
    copy: opts.copy,
  };
}

export function storagePath(userId: string, r: ReceiptRow) {
  return `${userId}/receipts/receipt-${r.receipt_number.replace(/[^\w-]/g, "_")}.pdf`;
}

/**
 * Returns the stored original PDF, generating and storing it first if it is missing.
 * Never allocates a number. The stored file is never overwritten.
 */
export async function getOrCreateStoredPdf(
  supabase: SupabaseClient,
  userId: string,
  r: ReceiptRow,
  footer?: string | null,
): Promise<Uint8Array> {
  if (r.pdf_path) {
    const { data, error } = await supabase.storage.from("business-documents").download(r.pdf_path);
    if (!error && data) return new Uint8Array(await data.arrayBuffer());
  }
  const path = r.pdf_path ?? storagePath(userId, r);
  // Rendered from the immutable snapshot, as an original, without a cancelled mark.
  const bytes = await generateReceiptPdf(toPdfData({ ...r, status: "issued" }, { footer }));
  const { error: upErr } = await supabase.storage
    .from("business-documents")
    .upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (upErr && !/exists|duplicate/i.test(upErr.message)) throw new Error("USER:שמירת קובץ ה-PDF נכשלה.");
  if (!r.pdf_path) {
    const sha = createHash("sha256").update(bytes).digest("hex");
    await supabase.from("receipts").update({ pdf_path: path, pdf_sha256: sha }).eq("id", r.id).is("pdf_path", null);
  }
  return bytes;
}
