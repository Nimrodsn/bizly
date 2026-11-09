import Link from "next/link";
import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateHe, formatIls } from "@/lib/format";
import type { ReceiptRow } from "@/lib/receipts/constants";

export default async function ReceiptsPage() {
  const ctx = await requireBusinessContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("receipts")
    .select("id, receipt_number, issue_date, client_name, amount, status, seq")
    .eq("business_id", ctx.businessId)
    .order("seq", { ascending: false });
  const rows = (data ?? []) as Pick<ReceiptRow, "id" | "receipt_number" | "issue_date" | "client_name" | "amount" | "status" | "seq">[];
  const total = rows.filter((r) => r.status === "issued").reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="קבלות"
        description={rows.length ? `${rows.length} קבלות · סה״כ שהונפק (ללא מבוטלות): ${formatIls(total)}` : undefined}
        actions={
          <Button asChild>
            <Link href="/receipts/new">קבלה חדשה</Link>
          </Button>
        }
      />
      {!rows.length ? (
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <p className="font-medium">עדיין לא הונפקו קבלות</p>
            <p className="text-sm text-slate-500">הנפק את הקבלה הראשונה שלך בכמה שניות.</p>
            <Button asChild>
              <Link href="/receipts/new">קבלה חדשה</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Link key={r.id} href={`/receipts/${r.id}`} className="block">
              <Card className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900">
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      קבלה {r.receipt_number} · {r.client_name}
                    </p>
                    <p className="text-xs text-slate-500">{formatDateHe(r.issue_date)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {r.status === "cancelled" ? (
                      <span className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">מבוטלת</span>
                    ) : null}
                    <p className={`font-semibold ${r.status === "cancelled" ? "text-slate-400 line-through" : ""}`}>
                      {formatIls(Number(r.amount))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
