"use server";

import { requireBusinessContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { clientSchema, supplierSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";

export async function createClientAction(formData: FormData) {
  const ctx = await requireBusinessContext();
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    tax_id: formData.get("tax_id"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) throw new Error("USER:יש לתקן את השדות המסומנים.");
  const supabase = await createClient();
  const { error } = await supabase.from("clients").insert({
    business_id: ctx.businessId,
    ...parsed.data,
    email: parsed.data.email || null,
  });
  if (error) throw new Error("USER:לא ניתן לשמור את הנתונים כרגע. נסה שוב.");
  revalidatePath("/clients");
}

export async function createSupplierAction(formData: FormData) {
  const ctx = await requireBusinessContext();
  const parsed = supplierSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes"),
    tax_id: formData.get("tax_id"),
  });
  if (!parsed.success) throw new Error("USER:יש לתקן את השדות המסומנים.");
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").insert({
    business_id: ctx.businessId,
    ...parsed.data,
    email: parsed.data.email || null,
  });
  if (error) throw new Error("USER:לא ניתן לשמור את הנתונים כרגע. נסה שוב.");
  revalidatePath("/suppliers");
}

export async function createActivityAction(formData: FormData) {
  const ctx = await requireBusinessContext();
  const name = formData.get("name")?.toString().trim();
  if (!name) throw new Error("USER:יש להזין שם תחום.");
  const supabase = await createClient();
  const { error } = await supabase.from("activities").insert({
    business_id: ctx.businessId,
    name,
  });
  if (error) throw new Error("USER:לא ניתן לשמור את הנתונים כרגע. נסה שוב.");
  revalidatePath("/settings/activities");
  revalidatePath("/income/new");
}

export async function createCategoryAction(formData: FormData) {
  const ctx = await requireBusinessContext();
  const name = formData.get("name")?.toString().trim();
  if (!name) throw new Error("USER:יש להזין שם קטגוריה.");
  const supabase = await createClient();
  const { error } = await supabase.from("expense_categories").insert({
    business_id: ctx.businessId,
    name,
  });
  if (error) throw new Error("USER:לא ניתן לשמור את הנתונים כרגע. נסה שוב.");
  revalidatePath("/settings/categories");
  revalidatePath("/expenses/new");
}
