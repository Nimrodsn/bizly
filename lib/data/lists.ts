import { createClient } from "@/lib/supabase/server";

export async function getLookupLists(businessId: string) {
  const supabase = await createClient();
  const [activities, paymentMethods, clients, suppliers, categories] = await Promise.all([
    supabase.from("activities").select("id, name").eq("business_id", businessId).eq("active", true).order("display_order"),
    supabase.from("payment_methods").select("id, name").eq("business_id", businessId).eq("active", true).order("display_order"),
    supabase.from("clients").select("id, name").eq("business_id", businessId).eq("active", true),
    supabase.from("suppliers").select("id, name").eq("business_id", businessId).eq("active", true),
    supabase.from("expense_categories").select("id, name").eq("business_id", businessId).eq("active", true),
  ]);
  return {
    activities: activities.data ?? [],
    paymentMethods: paymentMethods.data ?? [],
    clients: clients.data ?? [],
    suppliers: suppliers.data ?? [],
    categories: categories.data ?? [],
  };
}
