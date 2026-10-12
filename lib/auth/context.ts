import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type BusinessContext = {
  userId: string;
  businessId: string;
  business: {
    id: string;
    name: string;
    tax_year: number;
    tax_status: string;
    income_tax_status: string;
    default_currency: string;
    receipt_prefix: string;
    receipt_next_number: number;
  };
  profile: {
    onboarding_completed: boolean;
  };
};

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function getBusinessContext(): Promise<BusinessContext | null> {
  const { supabase, user } = await requireUser();

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, name, tax_year, tax_status, income_tax_status, default_currency, receipt_prefix, receipt_next_number",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    businessId: business.id,
    business,
    profile: profile ?? { onboarding_completed: false },
  };
}

export async function requireBusinessContext(): Promise<BusinessContext> {
  const ctx = await getBusinessContext();
  if (!ctx) redirect("/onboarding");
  return ctx;
}
