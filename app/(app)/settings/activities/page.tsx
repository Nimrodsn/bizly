import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { createActivityAction } from "@/lib/actions/entities";
import { PageHeader } from "@/components/shell/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ActivitiesSettingsPage() {
  const ctx = await requireBusinessContext();
  const supabase = await createClient();
  const { data: activities } = await supabase
    .from("activities")
    .select("id, name, active")
    .eq("business_id", ctx.businessId)
    .order("display_order");

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHeader title="תחומי פעילות" />
      {(activities ?? []).map((a) => (
        <Card key={a.id}>
          <CardContent className="py-4">{a.name}</CardContent>
        </Card>
      ))}
      <form action={createActivityAction} className="flex gap-2">
        <Input name="name" placeholder="תחום חדש" required />
        <Button type="submit">הוסף</Button>
      </form>
    </div>
  );
}
