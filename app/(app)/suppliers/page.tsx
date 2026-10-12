import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { createSupplierAction } from "@/lib/actions/entities";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default async function SuppliersPage() {
  const ctx = await requireBusinessContext();
  const supabase = await createClient();
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name, tax_id")
    .eq("business_id", ctx.businessId)
    .eq("active", true);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <PageHeader title="ספקים" />
        <div className="space-y-2">
          {(suppliers ?? []).map((s) => (
            <Card key={s.id}>
              <CardContent className="py-4">
                <p className="font-medium">{s.name}</p>
                {s.tax_id ? <p className="text-xs text-slate-500">{s.tax_id}</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Card>
        <CardContent className="space-y-3 pt-6">
          <h2 className="font-semibold">ספק חדש</h2>
          <form action={createSupplierAction} className="space-y-3">
            <div>
              <Label htmlFor="name">שם</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="tax_id">ח.פ / ע.מ</Label>
              <Input id="tax_id" name="tax_id" />
            </div>
            <Button type="submit">שמור</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
