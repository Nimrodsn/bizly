import { createClient } from "@/lib/supabase/server";

export type TaxConfiguration = {
  id: string;
  country: string;
  tax_year: number;
  vat_exempt_ceiling: number | null;
  small_business_turnover_ceiling: number | null;
  small_business_expense_rate: number | null;
  training_fund_taxable_deduction_rate: number | null;
  training_fund_annual_exemption_ceiling: number | null;
  training_fund_income_ceiling: number | null;
  source_url: string | null;
};

export async function getTaxConfiguration(
  taxYear: number,
  country = "IL",
): Promise<TaxConfiguration | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tax_configurations")
    .select("*")
    .eq("tax_year", taxYear)
    .eq("country", country)
    .maybeSingle();

  if (error || !data) return null;
  return data as TaxConfiguration;
}
