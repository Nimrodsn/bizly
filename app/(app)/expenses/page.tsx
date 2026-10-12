import Link from "next/link";
import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateHe, formatIls } from "@/lib/format";
import { EmptyState } from "@/components/shell/empty-state";
import { t } from "@/lib/i18n/he";

export default async function ExpensesPage() {
  const ctx = await requireBusinessContext();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("expense_transactions")
    .select("id, amount, expense_date, description")
    .eq("business_id", ctx.businessId)
    .is("deleted_at", null)
    .order("expense_date", { ascending: false })
    .limit(50);

  return (
    <div>
      <PageHeader
        title={t("nav.expenses")}
        actions={
          <Button asChild variant="expense">
            <Link href="/expenses/new">הוצאה חדשה</Link>
          </Button>
        }
      />
      {!rows?.length ? (
        <EmptyState
          title={t("toast.noTransactions")}
          description="הוסף את ההוצאה הראשונה שלך"
          primaryHref="/expenses/new"
          primaryLabel={t("dashboard.addExpense")}
        />
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <Card key={row.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{row.description ?? "הוצאה"}</p>
                  <p className="text-xs text-slate-500">{formatDateHe(row.expense_date)}</p>
                </div>
                <p className="font-semibold text-orange-600">{formatIls(Number(row.amount))}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
