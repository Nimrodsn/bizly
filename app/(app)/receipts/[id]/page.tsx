import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReceiptActions } from "@/components/receipts/receipt-actions";
import { formatDateHe, formatIls } from "@/lib/format";
import type { ReceiptRow } from "@/lib/receipts/constants";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireBusinessContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("receipts")
    .select("*")
    .eq("id", id)
    .eq("business_id", ctx.businessId)
    .maybeSingle();
  if (!data) notFound();
  const r = data as ReceiptRow;
  const cancelled = r.status === "cancelled";

  const rows: [string, string][] = [
    ["לקוח", r.client_name],
    ...(r.client_tax_id ? ([["ת.ז / ח.פ", r.client_tax_id]] as [string, string][]) : []),
    ...(r.client_address ? ([["כתובת", r.client_address]] as [string, string][]) : []),
    ["תאריך", formatDateHe(r.issue_date)],
    ["תיאור", r.description],
    ["אמצעי תשלום", r.payment_details ? `${r.payment_method} · ${r.payment_details}` : r.payment_method],
  ];

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader
        title={`קבלה מס׳ ${r.receipt_number}`}
        description={cancelled ? `מבוטלת · ${r.cancel_reason ?? ""}` : undefined}
        actions={
          <Button asChild variant="ghost">
            <Link href="/receipts">לכל הקבלות</Link>
          </Button>
        }
      />
      <Card className={cancelled ? "border-red-200" : undefined}>
        <CardContent className="space-y-3 py-5 text-sm">
          <p className={`text-3xl font-semibold ${cancelled ? "text-slate-400 line-through" : ""}`}>
            {formatIls(Number(r.amount))}
          </p>
          {rows.map(([k, v]) => (
            <p key={k} className="flex gap-2">
              <span className="w-24 shrink-0 text-slate-500">{k}</span>
              <span className="min-w-0 break-words">{v}</span>
            </p>
          ))}
          {r.emailed_at ? <p className="text-xs text-slate-500">נשלחה במייל ב-{formatDateHe(r.emailed_at)}</p> : null}
        </CardContent>
      </Card>
      <ReceiptActions
        id={r.id}
        number={r.receipt_number}
        cancelled={cancelled}
        clientEmail={r.client_email ?? ""}
        emailEnabled={Boolean(process.env.RESEND_API_KEY && process.env.RECEIPT_FROM_EMAIL)}
        issuer={r.issuer_name}
      />
    </div>
  );
}
