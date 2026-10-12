import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowsToCsv, rowsToXlsxBuffer } from "@/lib/reports/export";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "income";
  const format = searchParams.get("format") ?? "csv";

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!business) return NextResponse.json({ error: "No business" }, { status: 400 });

  const table = type === "expense" ? "expense_transactions" : "income_transactions";
  const { data } = await supabase.from(table).select("*").eq("business_id", business.id).is("deleted_at", null);

  const rows = (data ?? []) as Record<string, unknown>[];

  if (format === "xlsx") {
    const buf = rowsToXlsxBuffer(rows, type);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${type}.xlsx"`,
      },
    });
  }

  return new NextResponse(rowsToCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}.csv"`,
    },
  });
}
