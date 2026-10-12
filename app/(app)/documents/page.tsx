import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { UploadPanel } from "@/components/documents/upload-panel";

export default async function DocumentsPage() {
  const ctx = await requireBusinessContext();
  const supabase = await createClient();
  const { data: docs } = await supabase
    .from("documents")
    .select("id, file_name, uploaded_at, ai_extraction_status")
    .eq("business_id", ctx.businessId)
    .order("uploaded_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <PageHeader title="מסמכים" description="העלאה, סריקה וניתוח AI" />
      <Card>
        <CardContent className="pt-6">
          <UploadPanel />
        </CardContent>
      </Card>
      <div className="space-y-2">
        {(docs ?? []).map((d) => (
          <Card key={d.id}>
            <CardContent className="flex justify-between py-4 text-sm">
              <span>{d.file_name}</span>
              <span className="text-slate-500">{d.ai_extraction_status}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
