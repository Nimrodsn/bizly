import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { createCategoryAction } from "@/lib/actions/entities";
import { PageHeader } from "@/components/shell/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function CategoriesSettingsPage() {
  const ctx = await requireBusinessContext();
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("expense_categories")
    .select("id, name")
    .eq("business_id", ctx.businessId);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHeader title="קטגוריות הוצאה" />
      {(categories ?? []).map((c) => (
        <Card key={c.id}>
          <CardContent className="py-4">{c.name}</CardContent>
        </Card>
      ))}
      <form action={createCategoryAction} className="flex gap-2">
        <Input name="name" placeholder="קטגוריה חדשה" required />
        <Button type="submit">הוסף</Button>
      </form>
    </div>
  );
}
