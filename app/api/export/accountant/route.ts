import { NextResponse } from "next/server";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { rowsToCsv } from "@/lib/reports/export";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id, tax_year, name")
    .eq("user_id", user.id)
    .single();
  if (!business) return NextResponse.json({ error: "No business" }, { status: 400 });

  const year = business.tax_year;
  const [income, expenses, tax, fund] = await Promise.all([
    supabase.from("income_transactions").select("*").eq("business_id", business.id).is("deleted_at", null),
    supabase.from("expense_transactions").select("*").eq("business_id", business.id).is("deleted_at", null),
    supabase.from("tax_configurations").select("*").eq("tax_year", year).eq("country", "IL").maybeSingle(),
    supabase.from("training_fund_records").select("*").eq("business_id", business.id).eq("tax_year", year).maybeSingle(),
  ]);

  const zip = new JSZip();
  const root = zip.folder(String(year));
  root?.file("income/income.csv", rowsToCsv((income.data ?? []) as Record<string, unknown>[]));
  root?.file("expenses/expenses.csv", rowsToCsv((expenses.data ?? []) as Record<string, unknown>[]));
  root?.file(
    "tax/tax-summary.json",
    JSON.stringify({ business: business.name, tax: tax.data, generated_at: new Date().toISOString() }, null, 2),
  );
  root?.file("tax/training-fund.json", JSON.stringify(fund.data ?? {}, null, 2));
  root?.file(
    "reports/annual-summary.txt",
    `עסק: ${business.name}\nשנת מס: ${year}\nהכנסות: ${(income.data ?? []).length}\nהוצאות: ${(expenses.data ?? []).length}\n`,
  );

  const bytes = await zip.generateAsync({ type: "uint8array" });
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="accountant-${year}.zip"`,
    },
  });
}
