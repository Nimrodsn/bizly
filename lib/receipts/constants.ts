export const PAYMENT_METHODS = [
  "העברה בנקאית",
  "Bit",
  "PayBox",
  "מזומן",
  "צ׳ק",
  "כרטיס אשראי",
  "אחר",
] as const;

export type ReceiptRow = {
  issuer_footer?: string | null;
  id: string;
  business_id: string;
  seq: number;
  receipt_number: string;
  issue_date: string;
  client_id: string | null;
  client_name: string;
  client_tax_id: string | null;
  client_address: string | null;
  client_email: string | null;
  description: string;
  amount: number | string;
  payment_method: string;
  payment_details: string | null;
  issuer_name: string;
  issuer_owner: string | null;
  issuer_tax_id: string | null;
  issuer_address: string | null;
  issuer_phone: string | null;
  issuer_email: string | null;
  status: "issued" | "cancelled";
  cancelled_at: string | null;
  cancel_reason: string | null;
  income_transaction_id: string | null;
  pdf_path: string | null;
  pdf_sha256: string | null;
  emailed_at: string | null;
  created_at: string;
};
