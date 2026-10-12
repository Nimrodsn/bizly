import { requireBusinessContext } from "@/lib/auth/context";
import { getTaxConfiguration } from "@/lib/tax/config";
import { getDashboardAggregates } from "@/lib/data/aggregates";
import {
  actualVsNormalizedMessage,
  estimatedTaxableBusinessIncome,
  normalizedExpenses,
} from "@/lib/calculations/small-business";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TurnoverCard } from "@/components/dashboard/turnover-card";
import { formatIls } from "@/lib/format";
import { t } from "@/lib/i18n/he";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function TaxPage() {
  const ctx = await requireBusinessContext();
  const tax = await getTaxConfiguration(ctx.business.tax_year);
  const aggregates = await getDashboardAggregates(ctx.businessId, ctx.business.tax_year);

  if (!tax) {
    return (
      <div>
        <PageHeader title={t("nav.tax")} />
        <p className="text-sm text-orange-600">{t("tax.noConfig")}</p>
      </div>
    );
  }

  const rate = tax.small_business_expense_rate ?? 0;
  const normalized = normalizedExpenses(aggregates.turnover, rate);
  const estimated = estimatedTaxableBusinessIncome(aggregates.turnover, normalized);

  const supabase = await createClient();
  const { data: yearExpenses } = await supabase
    .from("expense_transactions")
    .select("amount")
    .eq("business_id", ctx.businessId)
    .is("deleted_at", null)
    .gte("expense_date", `${ctx.business.tax_year}-01-01`)
    .lte("expense_date", `${ctx.business.tax_year}-12-31`);

  const actualTotal = (yearExpenses ?? []).reduce(
    (a: number, r: { amount: number }) => a + Number(r.amount),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.tax")}
        description={`${t("tax.dataForYear")} ${ctx.business.tax_year}`}
      />
      <TurnoverCard
        taxYear={ctx.business.tax_year}
        turnover={aggregates.turnover}
        ceiling={tax.vat_exempt_ceiling}
        forecast={aggregates.forecast.forecast}
        avgMonthly={aggregates.forecast.avgMonthly}
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("tax.smallBusinessTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            {t("tax.turnover")}: {formatIls(aggregates.turnover)}
          </p>
          <p>
            {t("tax.recordedExpenses")}: {formatIls(actualTotal)}
          </p>
          <p>
            {(rate * 100).toFixed(0)}% {t("tax.normalizedExpenses")}: {formatIls(normalized)}
          </p>
          <p className="font-medium">
            {t("tax.estimatedIncome")}: {formatIls(estimated)}
          </p>
          <p className="text-slate-500">{actualVsNormalizedMessage(actualTotal, normalized)}</p>
        </CardContent>
      </Card>
      <Link href="/training-fund" className="text-sm text-indigo-600 underline">
        {t("nav.trainingFund")}
      </Link>
      <p className="text-xs text-slate-500">{t("tax.disclaimer")}</p>
    </div>
  );
}
