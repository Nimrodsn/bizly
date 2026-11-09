"use server";

import { requireUser } from "@/lib/auth/context";
import { onboardingSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const DEFAULT_PAYMENT_METHODS = [
  "מזומן",
  "העברה בנקאית",
  "Bit",
  "PayBox",
  "כרטיס אשראי",
  "PayPal",
  "אחר",
];

export async function completeOnboardingAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  const activitiesRaw = formData.get("activities")?.toString() ?? "";
  const activities = activitiesRaw
    .split("\n")
    .map((a) => a.trim())
    .filter(Boolean);

  const parsed = onboardingSchema.safeParse({
    businessName: formData.get("businessName"),
    activities,
    tax_status: formData.get("tax_status") ?? "EXEMPT_DEALER",
    income_tax_status: formData.get("income_tax_status") ?? "SMALL_BUSINESS_OWNER",
    tax_year: formData.get("tax_year") ?? 2026,
  });

  if (!parsed.success) {
    throw new Error("USER:יש לתקן את השדות המסומנים.");
  }

  const { data: existing } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) redirect("/dashboard");

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({
      user_id: user.id,
      name: parsed.data.businessName,
      tax_status: parsed.data.tax_status,
      income_tax_status: parsed.data.income_tax_status,
      tax_year: parsed.data.tax_year,
    })
    .select("id")
    .single();

  if (businessError || !business) {
    throw new Error("USER:לא ניתן לשמור את הנתונים כרגע. נסה שוב.");
  }

  const activityRows = parsed.data.activities.map((name, index) => ({
    business_id: business.id,
    name,
    display_order: index,
  }));
  await supabase.from("activities").insert(activityRows);

  const paymentRows = DEFAULT_PAYMENT_METHODS.map((name, index) => ({
    business_id: business.id,
    name,
    is_system: true,
    display_order: index,
  }));
  await supabase.from("payment_methods").insert(paymentRows);

  await supabase.from("user_settings").insert({
    user_id: user.id,
    business_id: business.id,
  });

  await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id);

  revalidatePath("/", "layout");
  redirect("/settings/business");
}
