import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReceiptPdf } from "@/lib/documents/receipt-pdf";
import { formatDateHe, formatIls } from "@/lib/format";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { incomeId } = (await request.json()) as { incomeId?: string };
  if (!incomeId) return NextResponse.json({ error: "Missing incomeId" }, { status: 400 });

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!business) return NextResponse.json({ error: "No business" }, { status: 400 });

  const { data: income } = await supabase
    .from("income_transactions")
    .select("*")
    .eq("id", incomeId)
    .eq("business_id", business.id)
    .single();
  if (!income) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let clientName: string | undefined;
  if (income.client_id) {
    const { data: client } = await supabase.from("clients").select("name").eq("id", income.client_id).single();
    clientName = client?.name;
  }
  let activityName: string | undefined;
  if (income.activity_id) {
    const { data: activity } = await supabase.from("activities").select("name").eq("id", income.activity_id).single();
    activityName = activity?.name;
  }
  let paymentName: string | undefined;
  if (income.payment_method_id) {
    const { data: pm } = await supabase
      .from("payment_methods")
      .select("name")
      .eq("id", income.payment_method_id)
      .single();
    paymentName = pm?.name;
  }

  const { data: receiptNumber, error: rpcError } = await supabase.rpc("allocate_receipt_number", {
    p_business_id: business.id,
  });
  if (rpcError || !receiptNumber) {
    return NextResponse.json({ error: "Number allocation failed" }, { status: 500 });
  }

  const pdf = generateReceiptPdf({
    businessName: business.name,
    businessAddress: business.address ?? undefined,
    businessPhone: business.phone ?? undefined,
    receiptNumber: String(receiptNumber),
    issueDate: formatDateHe(income.transaction_date),
    clientName,
    description: income.description ?? undefined,
    amount: formatIls(Number(income.amount)),
    paymentMethod: paymentName,
    activity: activityName,
  });

  await supabase.from("business_documents").insert({
    business_id: business.id,
    income_transaction_id: income.id,
    document_number: String(receiptNumber),
    document_type: "receipt",
  });

  await supabase.from("income_transactions").update({ receipt_number: String(receiptNumber) }).eq("id", income.id);

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="receipt-${receiptNumber}.pdf"`,
    },
  });
}
