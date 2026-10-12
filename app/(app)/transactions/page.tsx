import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateHe, formatIls } from "@/lib/format";
import { t } from "@/lib/i18n/he";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const ctx = await requireBusinessContext();
  const params = await searchParams;
  const supabase = await createClient();

  const { data: income } = await supabase
    .from("income_transactions")
    .select("id, amount, transaction_date, description, status")
    .eq("business_id", ctx.businessId)
    .is("deleted_at", null)
    .order("transaction_date", { ascending: false })
    .limit(100);

  const { data: expenses } = await supabase
    .from("expense_transactions")
    .select("id, amount, expense_date, description")
    .eq("business_id", ctx.businessId)
    .is("deleted_at", null)
    .order("expense_date", { ascending: false })
    .limit(100);

  type Row = {
    id: string;
    kind: "income" | "expense";
    date: string;
    description: string;
    amount: number;
  };

  let rows: Row[] = [
    ...(income ?? []).map((r) => ({
      id: r.id,
      kind: "income" as const,
      date: r.transaction_date,
      description: r.description ?? "הכנסה",
      amount: Number(r.amount),
    })),
    ...(expenses ?? []).map((r) => ({
      id: r.id,
      kind: "expense" as const,
      date: r.expense_date,
      description: r.description ?? "הוצאה",
      amount: Number(r.amount),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  if (params.type === "income") rows = rows.filter((r) => r.kind === "income");
  if (params.type === "expense") rows = rows.filter((r) => r.kind === "expense");
  if (params.q) {
    const q = params.q.toLowerCase();
    rows = rows.filter((r) => r.description.toLowerCase().includes(q) || String(r.amount).includes(q));
  }

  return (
    <div>
      <PageHeader title={t("nav.transactions")} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="חיפוש..."
          className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
        <select
          name="type"
          defaultValue={params.type ?? ""}
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="">הכל</option>
          <option value="income">הכנסות</option>
          <option value="expense">הוצאות</option>
        </select>
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 text-sm text-white">
          סנן
        </button>
      </form>
      <div className="space-y-2">
        {rows.map((row) => (
          <Card key={`${row.kind}-${row.id}`}>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="text-xs text-slate-500">{row.kind === "income" ? "הכנסה" : "הוצאה"}</p>
                <p className="font-medium">{row.description}</p>
                <p className="text-xs text-slate-500">{formatDateHe(row.date)}</p>
              </div>
              <p
                className={
                  row.kind === "income" ? "font-semibold text-emerald-600" : "font-semibold text-orange-600"
                }
              >
                {row.kind === "expense" ? "-" : ""}
                {formatIls(row.amount)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
