"use server";

import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markMonthReviewedAction(formData: FormData) {
  const ctx = await requireBusinessContext();
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  const supabase = await createClient();
  await supabase.from("monthly_reviews").upsert(
    {
      business_id: ctx.businessId,
      year,
      month,
      reviewed_at: new Date().toISOString(),
    },
    { onConflict: "business_id,year,month" },
  );
  revalidatePath("/monthly-close");
}

export async function syncNotificationsAction() {
  const ctx = await requireBusinessContext();
  const supabase = await createClient();
  const { getDashboardAggregates } = await import("@/lib/data/aggregates");
  const { getTaxConfiguration } = await import("@/lib/tax/config");
  const aggregates = await getDashboardAggregates(ctx.businessId, ctx.business.tax_year);
  const tax = await getTaxConfiguration(ctx.business.tax_year);
  if (tax?.vat_exempt_ceiling && aggregates.turnover / tax.vat_exempt_ceiling >= 0.75) {
    await supabase.from("notifications").insert({
      business_id: ctx.businessId,
      user_id: ctx.userId,
      type: "turnover_threshold",
      title: "הגעת ל-75% מתקרת המחזור",
      body: "מומלץ לעקוב אחרי קצב ההכנסות.",
    });
  }
}
