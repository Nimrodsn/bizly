import { createClient } from "@/lib/supabase/server";

const MONTHS = ["ינו", "פבר", "מרץ", "אפר", "מאי", "יונ", "יול", "אוג", "ספט", "אוק", "נוב", "דצמ"];

export type MonthlyCashflow = {
  month: string;
  monthIndex: number;
  income: number;
  expenses: number;
  net: number;
  cumulative: number;
};

export async function getYearCashflow(businessId: string, year: number): Promise<MonthlyCashflow[]> {
  const supabase = await createClient();
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const [{ data: income }, { data: expenses }] = await Promise.all([
    supabase
      .from("income_transactions")
      .select("amount, transaction_date, status")
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .gte("transaction_date", start)
      .lte("transaction_date", end),
    supabase
      .from("expense_transactions")
      .select("amount, expense_date")
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .gte("expense_date", start)
      .lte("expense_date", end),
  ]);

  const buckets = MONTHS.map((month, monthIndex) => ({
    month,
    monthIndex,
    income: 0,
    expenses: 0,
    net: 0,
    cumulative: 0,
  }));

  for (const row of income ?? []) {
    if (row.status !== "received" && row.status !== "refunded") continue;
    const idx = new Date(row.transaction_date).getMonth();
    const sign = row.status === "refunded" ? -1 : 1;
    buckets[idx].income += sign * Number(row.amount);
  }
  for (const row of expenses ?? []) {
    const idx = new Date(row.expense_date).getMonth();
    buckets[idx].expenses += Number(row.amount);
  }

  let cumulative = 0;
  for (const bucket of buckets) {
    bucket.net = bucket.income - bucket.expenses;
    cumulative += bucket.net;
    bucket.cumulative = cumulative;
  }

  return buckets;
}
