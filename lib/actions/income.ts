"use server";

import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { incomeSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";

export async function createIncomeAction(formData: FormData) {
  const ctx = await requireBusinessContext();
  const parsed = incomeSchema.safeParse({
    amount: formData.get("amount"),
    activity_id: formData.get("activity_id") || null,
    client_id: formData.get("client_id") || null,
    payment_method_id: formData.get("payment_method_id") || null,
    transaction_date: formData.get("transaction_date"),
    description: formData.get("description") || null,
    status: formData.get("status") ?? "received",
  });

  if (!parsed.success) throw new Error("USER:יש לתקן את השדות המסומנים.");

  const supabase = await createClient();
  const { error } = await supabase.from("income_transactions").insert({
    business_id: ctx.businessId,
    activity_id: parsed.data.activity_id,
    client_id: parsed.data.client_id,
    payment_method_id: parsed.data.payment_method_id,
    transaction_date: parsed.data.transaction_date,
    description: parsed.data.description,
    status: parsed.data.status,
    amount: parsed.data.amount,
    payment_received_at: parsed.data.status === "received" ? new Date().toISOString() : null,
  });

  if (error) throw new Error("USER:לא ניתן לשמור את הנתונים כרגע. נסה שוב.");

  revalidatePath("/dashboard");
  revalidatePath("/income");
  revalidatePath("/transactions");
}

export async function softDeleteIncomeAction(id: string) {
  const ctx = await requireBusinessContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("income_transactions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("business_id", ctx.businessId);
  if (error) throw new Error("USER:לא ניתן למחוק כרגע.");
  revalidatePath("/transactions");
  revalidatePath("/income");
  revalidatePath("/dashboard");
}

export async function duplicateIncomeAction(id: string) {
  const ctx = await requireBusinessContext();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("income_transactions")
    .select("*")
    .eq("id", id)
    .eq("business_id", ctx.businessId)
    .single();
  if (!row) throw new Error("USER:הפריט לא נמצא.");
  await supabase.from("income_transactions").insert({
    business_id: row.business_id,
    activity_id: row.activity_id,
    client_id: row.client_id,
    transaction_date: row.transaction_date,
    amount: row.amount,
    currency: row.currency,
    payment_method_id: row.payment_method_id,
    description: row.description ? `${row.description} (עותק)` : "(עותק)",
    status: row.status,
  });
  revalidatePath("/transactions");
  revalidatePath("/income");
}
