import { requireBusinessContext } from "@/lib/auth/context";
import { getLookupLists } from "@/lib/data/lists";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { IncomeForm } from "@/components/forms/income-form";

export default async function NewIncomePage() {
  const ctx = await requireBusinessContext();
  const lists = await getLookupLists(ctx.businessId);
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="הכנסה חדשה" description="מינימום שדות — שמירה מהירה" />
      <Card>
        <CardContent className="pt-6">
          <IncomeForm {...lists} />
        </CardContent>
      </Card>
    </div>
  );
}
