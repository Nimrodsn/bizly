"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  owner_name: z.string().trim().max(120).optional().default(""),
  tax_id: z.string().trim().regex(/^\d{5,9}$/, "id").or(z.literal("")),
  address: z.string().trim().max(300).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  email: z.union([z.literal(""), z.string().trim().email()]).optional().default(""),
  receipt_prefix: z.string().trim().max(10).optional().default(""),
  receipt_next_number: z.coerce.number().int().min(1).max(99999999).optional(),
  receipt_footer: z.string().trim().max(400).optional().default(""),
});

export async function updateBusinessAction(formData: FormData) {
  const ctx = await requireBusinessContext();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const idBad = parsed.error.issues.some((i) => i.path[0] === "tax_id");
    throw new Error(
      idBad ? "USER:מספר עוסק חייב להכיל 5 עד 9 ספרות." : "USER:יש לתקן את השדות המסומנים.",
    );
  }
  const v = parsed.data;
  const supabase = await createClient();

  // Numbering can only be changed while no receipt has been issued.
  const { count } = await supabase
    .from("receipts")
    .select("id", { count: "exact", head: true })
    .eq("business_id", ctx.businessId);
  const patch: Record<string, unknown> = {
    name: v.name,
    owner_name: v.owner_name || null,
    tax_id: v.tax_id || null,
    address: v.address || null,
    phone: v.phone || null,
    email: v.email || null,
    receipt_footer: v.receipt_footer || null,
  };
  if (!count) {
    patch.receipt_prefix = v.receipt_prefix;
    if (v.receipt_next_number) patch.receipt_next_number = v.receipt_next_number;
  }
  const { error } = await supabase.from("businesses").update(patch).eq("id", ctx.businessId);
  if (error) throw new Error("USER:לא ניתן לשמור את הנתונים כרגע. נסה שוב.");
  revalidatePath("/settings/business");
  revalidatePath("/receipts/new");
}
