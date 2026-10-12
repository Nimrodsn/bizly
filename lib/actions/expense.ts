"use server";

import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { expenseSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";

export async function createExpenseAction(formData: FormData) {
  const ctx = await requireBusinessContext();
  const parsed = expenseSchema.safeParse({
    amount: formData.get("amount"),
    expense_date: formData.get("expense_date"),
    supplier_id: formData.get("supplier_id") || null,
    category_id: formData.get("category_id") || null,
    payment_method_id: formData.get("payment_method_id") || null,
    description: formData.get("description") || null,
  });

  if (!parsed.success) throw new Error("USER:יש לתקן את השדות המסומנים.");

  const supabase = await createClient();
  const { error } = await supabase.from("expense_transactions").insert({
    business_id: ctx.businessId,
    ...parsed.data,
  });

  if (error) throw new Error("USER:לא ניתן לשמור את הנתונים כרגע. נסה שוב.");

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/transactions");
}

export async function softDeleteExpenseAction(id: string) {
  const ctx = await requireBusinessContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("expense_transactions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("business_id", ctx.businessId);
  if (error) throw new Error("USER:לא ניתן למחוק כרגע.");
  revalidatePath("/transactions");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}
