import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });

  const { data: business } = await supabase.from("businesses").select("id").eq("user_id", user.id).single();
  if (!business) return NextResponse.json({ results: [] });

  const [clients, suppliers, activities] = await Promise.all([
    supabase.from("clients").select("id, name").eq("business_id", business.id).ilike("name", `%${q}%`).limit(5),
    supabase.from("suppliers").select("id, name").eq("business_id", business.id).ilike("name", `%${q}%`).limit(5),
    supabase.from("activities").select("id, name").eq("business_id", business.id).ilike("name", `%${q}%`).limit(5),
  ]);

  return NextResponse.json({
    results: [
      ...(clients.data ?? []).map((r) => ({ type: "client", ...r })),
      ...(suppliers.data ?? []).map((r) => ({ type: "supplier", ...r })),
      ...(activities.data ?? []).map((r) => ({ type: "activity", ...r })),
    ],
  });
}
