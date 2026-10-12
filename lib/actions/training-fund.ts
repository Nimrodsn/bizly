"use server";

import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveTrainingFundAction(formData: FormData) {
  const ctx = await requireBusinessContext();
  const supabase = await createClient();
  const payload = {
    business_id: ctx.businessId,
    tax_year: ctx.business.tax_year,
    business_taxable_income: Number(formData.get("business_taxable_income") || 0),
    self_employed_deposits: Number(formData.get("self_employed_deposits") || 0),
    employer_deposits: Number(formData.get("employer_deposits") || 0),
  };
  const { error } = await supabase.from("training_fund_records").upsert(payload, {
    onConflict: "business_id,tax_year",
  });
  if (error) throw new Error("USER:לא ניתן לשמור את הנתונים כרגע. נסה שוב.");
  revalidatePath("/training-fund");
}
