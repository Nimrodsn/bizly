"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginWithGoogleAction() {
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) {
    throw new Error("USER:לא ניתן להתחבר כרגע. נסה שוב.");
  }
  redirect(data.url);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
