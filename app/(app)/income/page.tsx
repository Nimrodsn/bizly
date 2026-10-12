import Link from "next/link";
import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateHe, formatIls } from "@/lib/format";
import { EmptyState } from "@/components/shell/empty-state";
import { t } from "@/lib/i18n/he";
import { ReceiptButton } from "@/components/income/receipt-button";

export default async function IncomePage() {
  const ctx = await requireBusinessContext();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("income_transactions")
    .select("id, amount, transaction_date, description, status")
    .eq("business_id", ctx.businessId)
    .is("deleted_at", null)
    .order("transaction_date", { ascending: false })
    .limit(50);

  return (
    <div>
      <PageHeader
        title={t("nav.income")}
        actions={
          <Button asChild variant="income">
            <Link href="/income/new">הכנסה חדשה</Link>
          </Button>
        }
      />
      {!rows?.length ? (
        <EmptyState
          title={t("toast.noTransactions")}
          description={t("toast.firstIncome")}
          primaryHref="/income/new"
          primaryLabel={t("dashboard.addIncome")}
        />
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <Card key={row.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{row.description ?? "הכנסה"}</p>
                  <p className="text-xs text-slate-500">{formatDateHe(row.transaction_date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-emerald-600">{formatIls(Number(row.amount))}</p>
                  <ReceiptButton incomeId={row.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
