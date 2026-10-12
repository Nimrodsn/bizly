import { requireBusinessContext } from "@/lib/auth/context";
import { getLookupLists } from "@/lib/data/lists";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ExpenseForm } from "@/components/forms/expense-form";

export default async function NewExpensePage() {
  const ctx = await requireBusinessContext();
  const lists = await getLookupLists(ctx.businessId);
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="הוצאה חדשה" />
      <Card>
        <CardContent className="pt-6">
          <ExpenseForm {...lists} />
        </CardContent>
      </Card>
    </div>
  );
}
