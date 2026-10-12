import { requireBusinessContext } from "@/lib/auth/context";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function BusinessSettingsPage() {
  const ctx = await requireBusinessContext();
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="פרטי עסק" />
      <Card>
        <CardContent className="space-y-2 py-6 text-sm">
          <p>
            <span className="text-slate-500">שם: </span>
            {ctx.business.name}
          </p>
          <p>
            <span className="text-slate-500">שנת מס: </span>
            {ctx.business.tax_year}
          </p>
          <p>
            <span className="text-slate-500">מספר קבלה הבא: </span>
            {ctx.business.receipt_prefix}
            {ctx.business.receipt_next_number}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
