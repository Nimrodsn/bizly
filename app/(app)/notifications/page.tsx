import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { syncNotificationsAction } from "@/lib/actions/notifications";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateHe } from "@/lib/format";

export default async function NotificationsPage() {
  const ctx = await requireBusinessContext();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("notifications")
    .select("id, title, body, created_at, dismissed_at")
    .eq("business_id", ctx.businessId)
    .eq("user_id", ctx.userId)
    .is("dismissed_at", null)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHeader
        title="התראות"
        actions={
          <form action={syncNotificationsAction}>
            <Button type="submit" variant="outline" size="sm">
              בדוק תקרה
            </Button>
          </form>
        }
      />
      {!rows?.length ? <p className="text-sm text-slate-500">אין התראות פתוחות.</p> : null}
      {(rows ?? []).map((row) => (
        <Card key={row.id}>
          <CardContent className="py-4">
            <p className="font-medium">{row.title}</p>
            {row.body ? <p className="mt-1 text-sm text-slate-500">{row.body}</p> : null}
            <p className="mt-2 text-xs text-slate-400">{formatDateHe(row.created_at)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
