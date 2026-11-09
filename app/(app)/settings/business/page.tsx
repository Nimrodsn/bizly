import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { BusinessForm, type BusinessValues } from "@/components/settings/business-form";

export default async function BusinessSettingsPage() {
  const ctx = await requireBusinessContext();
  const supabase = await createClient();
  const [{ data: b }, { count }] = await Promise.all([
    supabase
      .from("businesses")
      .select("name, owner_name, tax_id, address, phone, email, receipt_prefix, receipt_next_number, receipt_footer")
      .eq("id", ctx.businessId)
      .single(),
    supabase.from("receipts").select("id", { count: "exact", head: true }).eq("business_id", ctx.businessId),
  ]);
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="פרטי עסק" description="הפרטים האלה מודפסים על כל קבלה חדשה. קבלות שכבר הונפקו לא משתנות." />
      <Card>
        <CardContent className="pt-6">
          <BusinessForm b={b as BusinessValues} numberingLocked={Boolean(count)} />
        </CardContent>
      </Card>
    </div>
  );
}
