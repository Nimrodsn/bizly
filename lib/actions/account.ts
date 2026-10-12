"use server";

import { requireUser } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { hasAdminClient, createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function deleteAccountAction(formData: FormData) {
  if (formData.get("confirm") !== "DELETE") {
    throw new Error("USER:נדרש אישור מחיקה.");
  }
  const { user } = await requireUser();
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (business && hasAdminClient()) {
    const admin = createAdminClient();
    await admin.from("businesses").delete().eq("id", business.id);
    const { data: files } = await admin.storage.from("business-documents").list(user.id, { limit: 1000 });
    if (files?.length) {
      await admin.storage
        .from("business-documents")
        .remove(files.map((f) => `${user.id}/${f.name}`));
    }
  }

  if (hasAdminClient()) {
    await createAdminClient().auth.admin.deleteUser(user.id);
  } else {
    await supabase.auth.signOut();
  }

  redirect("/login");
}
