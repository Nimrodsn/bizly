import { createClient } from "@/lib/supabase/server";
import { sumTurnover, forecastAnnualTurnover } from "@/lib/calculations/turnover";

export async function getDashboardAggregates(businessId: string, taxYear: number) {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const yearStart = `${taxYear}-01-01`;
  const yearEnd = `${taxYear}-12-31`;

  const { data: incomeRows } = await supabase
    .from("income_transactions")
    .select("amount, status, transaction_date, activity_id")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .gte("transaction_date", yearStart)
    .lte("transaction_date", yearEnd);

  const { data: expenseRows } = await supabase
    .from("expense_transactions")
    .select("amount, expense_date, category_id")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .gte("expense_date", yearStart)
    .lte("expense_date", yearEnd);

  const income = incomeRows ?? [];
  const expenses = expenseRows ?? [];

  const monthIncome = income
    .filter(
      (r) =>
        r.transaction_date >= monthStart &&
        r.transaction_date <= monthEnd &&
        r.status === "received",
    )
    .reduce((a, r) => a + Number(r.amount), 0);

  const monthExpenses = expenses
    .filter((r) => r.expense_date >= monthStart && r.expense_date <= monthEnd)
    .reduce((a, r) => a + Number(r.amount), 0);

  const turnover = sumTurnover(
    income.map((r) => ({
      amount: Number(r.amount),
      status: r.status,
      transaction_date: r.transaction_date,
    })),
    taxYear,
  );

  const forecast = forecastAnnualTurnover(turnover, now);

  const byActivity = new Map<string, number>();
  for (const row of income) {
    if (row.status !== "received" || !row.activity_id) continue;
    byActivity.set(
      row.activity_id,
      (byActivity.get(row.activity_id) ?? 0) + Number(row.amount),
    );
  }

  const byCategory = new Map<string, number>();
  for (const row of expenses) {
    const key = row.category_id ?? "uncategorized";
    byCategory.set(key, (byCategory.get(key) ?? 0) + Number(row.amount));
  }

  return {
    monthIncome,
    monthExpenses,
    monthNet: monthIncome - monthExpenses,
    turnover,
    forecast,
    byActivity,
    byCategory,
    incomeCount: income.length,
  };
}
