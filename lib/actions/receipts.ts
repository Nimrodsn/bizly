"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateStoredPdf } from "@/lib/receipts/pdf-service";
import type { ReceiptRow } from "@/lib/receipts/constants";

const receiptSchema = z.object({
  request_id: z.string().uuid(),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  client_id: z.string().uuid().nullable(),
  save_client: z.boolean(),
  client_name: z.string().trim().min(1).max(200),
  client_tax_id: z.string().trim().max(30).optional().default(""),
  client_address: z.string().trim().max(300).optional().default(""),
  client_email: z.union([z.literal(""), z.string().trim().email()]).optional().default(""),
  description: z.string().trim().min(1).max(1000),
  amount: z.coerce.number().positive().max(100000000),
  payment_method: z.string().trim().min(1).max(60),
  payment_details: z.string().trim().max(500).optional().default(""),
});

const INVALID = "USER:יש לתקן את השדות המסומנים.";

export async function issueReceiptAction(formData: FormData): Promise<{ id: string }> {
  const ctx = await requireBusinessContext();
  const parsed = receiptSchema.safeParse({
    request_id: formData.get("request_id"),
    issue_date: formData.get("issue_date"),
    client_id: formData.get("client_id") || null,
    save_client: formData.get("save_client") === "on",
    client_name: formData.get("client_name"),
    client_tax_id: formData.get("client_tax_id") ?? "",
    client_address: formData.get("client_address") ?? "",
    client_email: formData.get("client_email") ?? "",
    description: formData.get("description"),
    amount: formData.get("amount"),
    payment_method: formData.get("payment_method"),
    payment_details: formData.get("payment_details") ?? "",
  });
  if (!parsed.success) throw new Error(INVALID);
  const v = parsed.data;

  const supabase = await createClient();
  const { data: biz } = await supabase
    .from("businesses")
    .select("name, tax_id, receipt_footer")
    .eq("id", ctx.businessId)
    .single();
  if (!biz?.tax_id) throw new Error("USER:יש להזין מספר עוסק (ת.ז.) בהגדרות העסק לפני הנפקת קבלה.");

  const { data: prior } = await supabase.from("receipts").select("id").eq("business_id", ctx.businessId).eq("request_id", v.request_id).maybeSingle();
  if (prior) return { id: prior.id };

  // Create or update the client record so the picker stays useful.
  let clientId = v.client_id;
  if (!clientId && v.save_client) {
    const { data: c } = await supabase
      .from("clients")
      .insert({
        business_id: ctx.businessId,
        name: v.client_name,
        tax_id: v.client_tax_id || null,
        address: v.client_address || null,
        email: v.client_email || null,
      })
      .select("id")
      .single();
    clientId = c?.id ?? null;
  } else if (clientId) {
    await supabase
      .from("clients")
      .update({
        tax_id: v.client_tax_id || null,
        address: v.client_address || null,
        email: v.client_email || null,
      })
      .eq("id", clientId)
      .eq("business_id", ctx.businessId);
  }

  const { data, error } = await supabase.rpc("issue_receipt", {
    p_request_id: v.request_id,
    p_business_id: ctx.businessId,
    p_issue_date: v.issue_date,
    p_client_id: clientId,
    p_client_name: v.client_name,
    p_client_tax_id: v.client_tax_id,
    p_client_address: v.client_address,
    p_client_email: v.client_email,
    p_description: v.description,
    p_amount: v.amount,
    p_payment_method: v.payment_method,
    p_payment_details: v.payment_details,
  });
  if (error || !data) throw new Error("USER:הנפקת הקבלה נכשלה. נסה שוב.");
  const receipt = data as ReceiptRow;

  // Store the original PDF. If this fails the receipt still exists; the PDF route retries safely.
  try {
    await getOrCreateStoredPdf(supabase, ctx.userId, receipt, biz.receipt_footer);
  } catch {
    /* generated on first download instead */
  }

  revalidatePath("/receipts");
  revalidatePath("/income");
  revalidatePath("/dashboard");
  return { id: receipt.id };
}

export async function cancelReceiptAction(id: string, reason: string) {
  await requireBusinessContext();
  const r = z.string().trim().min(2).max(300).safeParse(reason);
  if (!r.success) throw new Error("USER:יש לציין סיבת ביטול.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_receipt", { p_receipt_id: id, p_reason: r.data });
  if (error) throw new Error("USER:ביטול הקבלה נכשל.");
  revalidatePath("/receipts");
  revalidatePath(`/receipts/${id}`);
  revalidatePath("/income");
  revalidatePath("/dashboard");
}

export async function emailReceiptAction(id: string, to: string) {
  const ctx = await requireBusinessContext();
  const email = z.string().trim().email().safeParse(to);
  if (!email.success) throw new Error("USER:כתובת אימייל לא תקינה.");
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RECEIPT_FROM_EMAIL;
  if (!key || !from) throw new Error("USER:שליחה במייל עדיין לא הוגדרה. הורד את הקבלה ושלח ידנית.");

  const supabase = await createClient();
  const { data: receipt } = await supabase
    .from("receipts")
    .select("*")
    .eq("id", id)
    .eq("business_id", ctx.businessId)
    .single();
  if (!receipt) throw new Error("USER:הקבלה לא נמצאה.");
  const r = receipt as ReceiptRow;
  const { data: biz } = await supabase.from("businesses").select("receipt_footer, email").eq("id", ctx.businessId).single();
  const pdf = await getOrCreateStoredPdf(supabase, ctx.userId, r, biz?.receipt_footer);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email.data],
      reply_to: biz?.email || undefined,
      subject: `קבלה מס׳ ${r.receipt_number} מאת ${r.issuer_name}`,
      html: `<div dir="rtl" style="font-family:Arial,sans-serif"><p>שלום,</p><p>מצורפת קבלה מס׳ ${r.receipt_number} על סך ${Number(r.amount).toLocaleString("he-IL")} ₪.</p><p>בברכה,<br/>${r.issuer_owner ?? r.issuer_name}</p></div>`,
      attachments: [{ filename: `receipt-${r.receipt_number}.pdf`, content: Buffer.from(pdf).toString("base64") }],
    }),
  });
  if (!res.ok) throw new Error("USER:שליחת האימייל נכשלה.");
  await supabase.from("receipts").update({ emailed_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(`/receipts/${id}`);
}
