import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  documentId: z.string().uuid(),
  supplier: z.string().optional(),
  date: z.string().optional(),
  totalAmount: z.coerce.number().positive(),
  description: z.string().optional(),
  category: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "יש לתקן את השדות" }, { status: 400 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!business) return NextResponse.json({ error: "No business" }, { status: 400 });

  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("id", parsed.data.documentId)
    .eq("business_id", business.id)
    .eq("user_id", user.id)
    .single();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let supplierId: string | null = null;
  if (parsed.data.supplier?.trim()) {
    const { data: existing } = await supabase
      .from("suppliers")
      .select("id")
      .eq("business_id", business.id)
      .eq("name", parsed.data.supplier.trim())
      .maybeSingle();
    if (existing) supplierId = existing.id;
    else {
      const { data: created } = await supabase
        .from("suppliers")
        .insert({ business_id: business.id, name: parsed.data.supplier.trim() })
        .select("id")
        .single();
      supplierId = created?.id ?? null;
    }
  }

  let categoryId: string | null = null;
  if (parsed.data.category?.trim()) {
    const { data: existing } = await supabase
      .from("expense_categories")
      .select("id")
      .eq("business_id", business.id)
      .eq("name", parsed.data.category.trim())
      .maybeSingle();
    if (existing) categoryId = existing.id;
    else {
      const { data: created } = await supabase
        .from("expense_categories")
        .insert({ business_id: business.id, name: parsed.data.category.trim() })
        .select("id")
        .single();
      categoryId = created?.id ?? null;
    }
  }

  const { error } = await supabase.from("expense_transactions").insert({
    business_id: business.id,
    expense_date: parsed.data.date || new Date().toISOString().slice(0, 10),
    amount: parsed.data.totalAmount,
    supplier_id: supplierId,
    category_id: categoryId,
    description: parsed.data.description || parsed.data.supplier || "הוצאה ממסמך",
    document_id: doc.id,
  });

  if (error) return NextResponse.json({ error: "לא ניתן לשמור" }, { status: 500 });

  await supabase
    .from("documents")
    .update({ document_type: "expense", ai_extraction_status: "completed" })
    .eq("id", doc.id);

  return NextResponse.json({ ok: true });
}
