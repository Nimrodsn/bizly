import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { createClientAction } from "@/lib/actions/entities";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default async function ClientsPage() {
  const ctx = await requireBusinessContext();
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, phone, email")
    .eq("business_id", ctx.businessId)
    .eq("active", true);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <PageHeader title="לקוחות" />
        <div className="space-y-2">
          {(clients ?? []).map((c) => (
            <Card key={c.id}>
              <CardContent className="py-4">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-slate-500">{c.phone ?? c.email ?? ""}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Card>
        <CardContent className="space-y-3 pt-6">
          <h2 className="font-semibold">לקוח חדש</h2>
          <form action={createClientAction} className="space-y-3">
            <div>
              <Label htmlFor="name">שם</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="phone">טלפון</Label>
              <Input id="phone" name="phone" />
            </div>
            <div>
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <Button type="submit">שמור</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
