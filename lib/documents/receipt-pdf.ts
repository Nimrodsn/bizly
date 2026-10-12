import { jsPDF } from "jspdf";

export type ReceiptData = {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  receiptNumber: string;
  issueDate: string;
  clientName?: string;
  description?: string;
  amount: string;
  paymentMethod?: string;
  activity?: string;
  footer?: string;
};

export function generateReceiptPdf(data: ReceiptData): Uint8Array {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.setR2L(true);
  doc.setFont("helvetica");
  let y = 20;
  doc.setFontSize(18);
  doc.text(data.businessName, 105, y, { align: "center" });
  y += 10;
  doc.setFontSize(11);
  if (data.businessAddress) {
    doc.text(data.businessAddress, 105, y, { align: "center" });
    y += 6;
  }
  doc.text(`קבלה ${data.receiptNumber}`, 190, y, { align: "right" });
  y += 8;
  doc.text(`תאריך: ${data.issueDate}`, 190, y, { align: "right" });
  y += 8;
  if (data.clientName) {
    doc.text(`לקוח: ${data.clientName}`, 190, y, { align: "right" });
    y += 8;
  }
  if (data.description) {
    doc.text(`תיאור: ${data.description}`, 190, y, { align: "right" });
    y += 8;
  }
  if (data.activity) {
    doc.text(`תחום: ${data.activity}`, 190, y, { align: "right" });
    y += 8;
  }
  doc.setFontSize(14);
  doc.text(`סכום: ${data.amount}`, 190, y, { align: "right" });
  y += 10;
  if (data.paymentMethod) {
    doc.setFontSize(11);
    doc.text(`אמצעי תשלום: ${data.paymentMethod}`, 190, y, { align: "right" });
  }
  y += 20;
  doc.setFontSize(9);
  doc.text(
    data.footer ??
      "מסמך עסקי מופק מהמערכת. אינו מהווה אישור על עמידה בדרישות חוקיות.",
    105,
    y,
    { align: "center", maxWidth: 170 },
  );
  return doc.output("arraybuffer") as unknown as Uint8Array;
}
