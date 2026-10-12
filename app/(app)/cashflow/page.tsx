import { requireBusinessContext } from "@/lib/auth/context";
import { getYearCashflow } from "@/lib/data/cashflow";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/shell/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { formatIls } from "@/lib/format";
import { t } from "@/lib/i18n/he";

export default async function CashflowPage() {
  const ctx = await requireBusinessContext();
  const year = ctx.business.tax_year;
  const months = await getYearCashflow(ctx.businessId, year);
  const now = new Date();
  const through = now.getFullYear() === year ? now.getMonth() : 11;
  const elapsed = months.slice(0, through + 1);
  const income = elapsed.reduce((a, m) => a + m.income, 0);
  const expenses = elapsed.reduce((a, m) => a + m.expenses, 0);
  const net = income - expenses;

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.cashflow")} description={`שנת ${year} · יתרת פתיחה ₪0 (אין חיבור לבנק)`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="יתרת פתיחה" value={formatIls(0)} />
        <StatCard title="הכנסות" value={formatIls(income)} tone="income" />
        <StatCard title="הוצאות" value={formatIls(expenses)} tone="expense" />
        <StatCard title="יתרת סגירה" value={formatIls(net)} tone="brand" hint={`תזרים נטו ${formatIls(net)}`} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>הכנסות מול הוצאות</CardTitle>
        </CardHeader>
        <CardContent>
          {income === 0 && expenses === 0 ? (
            <p className="text-sm text-slate-500">{t("toast.noTransactions")}</p>
          ) : (
            <CashflowChart data={months} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
