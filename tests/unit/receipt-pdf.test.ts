import { describe, expect, it } from "vitest";
import { drawable, generateReceiptPdf } from "@/lib/documents/receipt-pdf";

describe("receipt pdf", () => {
  it("leaves non-Hebrew text untouched", () => {
    expect(drawable("abc 123")).toBe("abc 123");
  });
  it("reverses Hebrew strings for fontkit and keeps digits intact after its reversal", () => {
    const d = drawable("שלום 123");
    // fontkit reverses the whole run again, so reversing back gives the visual order: digits on the left
    expect(Array.from(d).reverse().join("")).toBe("123 םולש");
  });
  it("generates a PDF", async () => {
    const bytes = await generateReceiptPdf({
      receiptNumber: "1",
      issueDate: "09/11/2026",
      issuerName: "עסק",
      clientName: "לקוח",
      description: "שירות",
      amount: 100,
      paymentMethod: "מזומן",
    });
    expect(Buffer.from(bytes.slice(0, 4)).toString()).toBe("%PDF");
  });
});
