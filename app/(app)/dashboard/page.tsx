import Link from "next/link";
import { requireBusinessContext } from "@/lib/auth/context";
import { getDashboardAggregates } from "@/lib/data/aggregates";
import { getTaxConfiguration } from "@/lib/tax/config";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/shell/stat-card";
import { EmptyState } from "@/components/shell/empty-state";
import { TurnoverCard } from "@/components/dashboard/turnover-card";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIls } from "@/lib/format";
import { t } from "@/lib/i18n/he";

export default async function DashboardPage() {
  const ctx = await requireBusinessContext();
  const aggregates = await getDashboardAggregates(ctx.businessId, ctx.business.tax_year);
  const tax = await getTaxConfiguration(ctx.business.tax_year);
  const supabase = await createClient();

  const { data: activities } = await supabase
    .from("activities")
    .select("id, name")
    .eq("business_id", ctx.businessId);

  const activityMap = new Map((activities ?? []).map((a) => [a.id, a.name]));
  const chartData = [...aggregates.byActivity.entries()].map(([id, total]) => ({
    name: activityMap.get(id) ?? "ללא תחום",
    total,
  }));

  const isEmpty = aggregates.incomeCount === 0;

  return (
    <div>
      <PageHeader
        title={`${t("dashboard.welcome")} 👋`}
        description={ctx.business.name}
        actions={
          <>
            <Button asChild variant="income" size="sm">
              <Link href="/income/new">{t("dashboard.addIncome")}</Link>
            </Button>
            <Button asChild variant="expense" size="sm">
              <Link href="/expenses/new">{t("dashboard.addExpense")}</Link>
            </Button>
          </>
        }
      />

      {isEmpty ? (
        <EmptyState
          title={t("dashboard.welcome")}
          description={t("dashboard.welcomeSubtitle")}
          primaryHref="/income/new"
          primaryLabel={t("dashboard.addIncome")}
          secondaryHref="/expenses/new"
          secondaryLabel={t("dashboard.addExpense")}
        />
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title={t("dashboard.monthIncome")} value={formatIls(aggregates.monthIncome)} tone="income" />
        <StatCard title={t("dashboard.monthExpenses")} value={formatIls(aggregates.monthExpenses)} tone="expense" />
        <StatCard title={t("dashboard.monthNet")} value={formatIls(aggregates.monthNet)} tone="brand" />
        <StatCard title={t("dashboard.turnover")} value={formatIls(aggregates.turnover)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TurnoverCard
          taxYear={ctx.business.tax_year}
          turnover={aggregates.turnover}
          ceiling={tax?.vat_exempt_ceiling ?? null}
          forecast={aggregates.forecast.forecast}
          avgMonthly={aggregates.forecast.avgMonthly}
        />
        <Card>
          <CardHeader>
            <CardTitle>הכנסות לפי תחום</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length ? (
              <ActivityChart data={chartData} />
            ) : (
              <p className="text-sm text-slate-500">{t("toast.noTransactions")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-xs text-slate-500">{t("tax.disclaimer")}</p>
    </div>
  );
}
