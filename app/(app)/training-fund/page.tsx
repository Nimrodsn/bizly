import { requireBusinessContext } from "@/lib/auth/context";
import { getTaxConfiguration } from "@/lib/tax/config";
import { saveTrainingFundAction } from "@/lib/actions/training-fund";
import { calculateTrainingFund } from "@/lib/calculations/training-fund";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatIls } from "@/lib/format";
import { t } from "@/lib/i18n/he";

export default async function TrainingFundPage() {
  const ctx = await requireBusinessContext();
  const tax = await getTaxConfiguration(ctx.business.tax_year);
  const supabase = await createClient();
  const { data: record } = await supabase
    .from("training_fund_records")
    .select("*")
    .eq("business_id", ctx.businessId)
    .eq("tax_year", ctx.business.tax_year)
    .maybeSingle();

  const result = tax
    ? calculateTrainingFund({
        businessTaxableIncome: Number(record?.business_taxable_income ?? 0),
        selfEmployedDeposits: Number(record?.self_employed_deposits ?? 0),
        employerDeposits: Number(record?.employer_deposits ?? 0),
        deductionRate: tax.training_fund_taxable_deduction_rate ?? 0.045,
        incomeCeiling: tax.training_fund_income_ceiling,
      })
    : null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title={t("nav.trainingFund")} description={`שנת מס ${ctx.business.tax_year}`} />
      {!tax ? <p className="text-sm text-orange-600">{t("tax.noConfig")}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>הזנת נתונים</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveTrainingFundAction} className="space-y-3">
            <div>
              <Label htmlFor="business_taxable_income">הכנסה עסקית חייבת (אומדן)</Label>
              <Input
                id="business_taxable_income"
                name="business_taxable_income"
                type="number"
                defaultValue={record?.business_taxable_income ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="self_employed_deposits">הפקדות כעצמאי</Label>
              <Input
                id="self_employed_deposits"
                name="self_employed_deposits"
                type="number"
                defaultValue={record?.self_employed_deposits ?? 0}
              />
            </div>
            <div>
              <Label htmlFor="employer_deposits">הפקדות דרך מעביד</Label>
              <Input
                id="employer_deposits"
                name="employer_deposits"
                type="number"
                defaultValue={record?.employer_deposits ?? 0}
              />
            </div>
            <Button type="submit">{t("actions.save")}</Button>
          </form>
        </CardContent>
      </Card>
      {result ? (
        <Card>
          <CardContent className="space-y-2 pt-6 text-sm">
            <p>ניכוי מestimated: {formatIls(result.estimatedDeductible)}</p>
            <p>הופקד: {formatIls(result.totalDeposited)}</p>
            <p>יתרה לניכוי משוער: {formatIls(result.remainingDeductible)}</p>
          </CardContent>
        </Card>
      ) : null}
      <p className="text-xs text-slate-500">{t("tax.trainingFundDisclaimer")}</p>
    </div>
  );
}
