import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sumTurnover, forecastAnnualTurnover } from "@/lib/calculations/turnover";
import { getTaxConfiguration } from "@/lib/tax/config";

export const toolSchemas = {
  get_monthly_income: z.object({
    businessId: z.string().uuid(),
    year: z.number(),
    month: z.number().min(1).max(12),
    activityId: z.string().uuid().optional(),
  }),
  get_turnover_progress: z.object({
    businessId: z.string().uuid(),
    taxYear: z.number(),
  }),
  get_expense_breakdown: z.object({
    businessId: z.string().uuid(),
    startDate: z.string(),
    endDate: z.string(),
  }),
};

export async function getMonthlyIncome(args: z.infer<typeof toolSchemas.get_monthly_income>) {
  const supabase = await createClient();
  const start = `${args.year}-${String(args.month).padStart(2, "0")}-01`;
  const endDate = new Date(args.year, args.month, 0).getDate();
  const end = `${args.year}-${String(args.month).padStart(2, "0")}-${endDate}`;

  let q = supabase
    .from("income_transactions")
    .select("amount, status")
    .eq("business_id", args.businessId)
    .eq("status", "received")
    .is("deleted_at", null)
    .gte("transaction_date", start)
    .lte("transaction_date", end);

  if (args.activityId) q = q.eq("activity_id", args.activityId);

  const { data } = await q;
  const total = (data ?? []).reduce((a, r) => a + Number(r.amount), 0);
  return { total, transactionCount: data?.length ?? 0, period: { start, end } };
}

export async function getTurnoverProgress(args: z.infer<typeof toolSchemas.get_turnover_progress>) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("income_transactions")
    .select("amount, status, transaction_date")
    .eq("business_id", args.businessId)
    .is("deleted_at", null)
    .gte("transaction_date", `${args.taxYear}-01-01`)
    .lte("transaction_date", `${args.taxYear}-12-31`);

  const turnover = sumTurnover(
    (data ?? []).map((r) => ({
      amount: Number(r.amount),
      status: r.status,
      transaction_date: r.transaction_date,
    })),
    args.taxYear,
  );
  const tax = await getTaxConfiguration(args.taxYear);
  const ceiling = tax?.vat_exempt_ceiling ?? null;
  const forecast = forecastAnnualTurnover(turnover, new Date());
  return { turnover, ceiling, forecast, transactionCount: data?.length ?? 0 };
}

export async function getExpenseBreakdown(
  args: z.infer<typeof toolSchemas.get_expense_breakdown>,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expense_transactions")
    .select("amount, category_id, expense_date")
    .eq("business_id", args.businessId)
    .is("deleted_at", null)
    .gte("expense_date", args.startDate)
    .lte("expense_date", args.endDate);

  const total = (data ?? []).reduce((a, r) => a + Number(r.amount), 0);
  return { total, transactionCount: data?.length ?? 0, rows: data ?? [] };
}
