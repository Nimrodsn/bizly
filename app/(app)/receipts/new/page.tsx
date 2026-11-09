import Link from "next/link";
import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ReceiptForm, type ClientOption } from "@/components/receipts/receipt-form";

export default async function NewReceiptPage() {
  const ctx = await requireBusinessContext();
  const supabase = await createClient();
  const [{ data: biz }, { data: clients }] = await Promise.all([
    supabase
      .from("businesses")
      .select("name, tax_id, receipt_prefix, receipt_next_number")
      .eq("id", ctx.businessId)
      .single(),
    supabase
      .from("clients")
      .select("id, name, tax_id, address, email")
      .eq("business_id", ctx.businessId)
      .eq("active", true)
      .order("name"),
  ]);
  const ready = Boolean(biz?.tax_id);
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jerusalem" }).format(new Date());

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="קבלה חדשה" />
      {!ready ? (
        <Card className="border-amber-300">
          <CardContent className="space-y-3 py-6 text-sm">
            <p className="font-medium">חסרים פרטי עסק</p>
            <p>כדי להנפיק קבלה יש להזין שם עסק ומספר עוסק פטור (ת.ז.) בהגדרות.</p>
            <Link className="font-medium text-indigo-600 underline" href="/settings/business">
              מעבר להגדרות העסק
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <ReceiptForm
              clients={(clients ?? []) as ClientOption[]}
              today={today}
              nextNumber={`${biz!.receipt_prefix}${biz!.receipt_next_number}`}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
