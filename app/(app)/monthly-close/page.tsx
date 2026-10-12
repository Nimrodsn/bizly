import { requireBusinessContext } from "@/lib/auth/context";
import { getDashboardAggregates } from "@/lib/data/aggregates";
import { createClient } from "@/lib/supabase/server";
import { markMonthReviewedAction } from "@/lib/actions/notifications";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatIls } from "@/lib/format";

export default async function MonthlyClosePage() {
  const ctx = await requireBusinessContext();
  const aggregates = await getDashboardAggregates(ctx.businessId, ctx.business.tax_year);
  const supabase = await createClient();
  const now = new Date();

  const { count: missingDocs } = await supabase
    .from("income_transactions")
    .select("id", { count: "exact", head: true })
    .eq("business_id", ctx.businessId)
    .is("document_id", null)
    .is("deleted_at", null);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHeader title="סגירת חודש" />
      <Card>
        <CardHeader>
          <CardTitle>
            {now.getMonth() + 1}/{now.getFullYear()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>הכנסות: {formatIls(aggregates.monthIncome)}</p>
          <p>הוצאות: {formatIls(aggregates.monthExpenses)}</p>
          <p>נטו: {formatIls(aggregates.monthNet)}</p>
          <p>עסקאות ללא מסמך: {missingDocs ?? 0}</p>
          <p className="text-slate-500">
            תחזית מחזור שנתי:{" "}
            {aggregates.forecast.forecast != null
              ? formatIls(aggregates.forecast.forecast)
              : "אין מספיק נתונים"}
          </p>
          <form action={markMonthReviewedAction}>
            <input type="hidden" name="year" value={now.getFullYear()} />
            <input type="hidden" name="month" value={now.getMonth() + 1} />
            <Button type="submit" className="mt-4">
              סמן חודש כנסקר
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
