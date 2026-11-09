import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import bidiFactory from "bidi-js";
import { HEEBO_BOLD_B64, HEEBO_REGULAR_B64 } from "./fonts";

const bidi = bidiFactory();

export type ReceiptPdfData = {
  receiptNumber: string;
  issueDate: string; // dd/mm/yyyy
  issuerName: string;
  issuerOwner?: string | null;
  issuerTaxId?: string | null;
  issuerAddress?: string | null;
  issuerPhone?: string | null;
  issuerEmail?: string | null;
  clientName: string;
  clientTaxId?: string | null;
  clientAddress?: string | null;
  description: string;
  amount: number;
  paymentMethod: string;
  paymentDetails?: string | null;
  footer?: string | null;
  cancelled?: boolean;
  /** false = מקור (original), true = העתק (copy) */
  copy?: boolean;
};

const PAIRS: Record<string, string> = { "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{", "<": ">", ">": "<" };

/**
 * Convert logical-order text to the string to hand to pdf-lib.
 * fontkit reverses the glyph run of any string that contains Hebrew (digits included) and applies
 * so for such strings we pass the reverse of the desired visual order. Brackets in RTL runs are
 * mirrored here. Strings without Hebrew are drawn as is.
 */
export function drawable(text: string): string {
  if (!text) return text;
  const levels = bidi.getEmbeddingLevels(text, "rtl");
  const items = text.split("").map((ch, i) => ({ ch, lvl: levels.levels[i] as number }));
  bidi.getReorderSegments(text, levels).forEach(([start, end]: number[]) => {
    const seg = items.slice(start, end + 1).reverse();
    items.splice(start, seg.length, ...seg);
  });
  const hebrew = /[\u0590-\u05FF]/.test(text);
  const mirrored = items.map((it) => (it.lvl % 2 === 1 && PAIRS[it.ch] ? PAIRS[it.ch] : it.ch));
  // fontkit reverses Hebrew-containing strings (no rtlm mirroring observed), so pre-reverse those.
  return (hebrew ? mirrored.reverse() : mirrored).join("");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split(/\r?\n/)) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(drawable(test), size) <= maxWidth || !line) line = test;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

export function formatAmountIls(n: number): string {
  return `₪${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function generateReceiptPdf(d: ReceiptPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(`קבלה ${d.receiptNumber}`);
  pdf.setProducer("Bizly");
  const regular = await pdf.embedFont(Buffer.from(HEEBO_REGULAR_B64, "base64"), { subset: true });
  const bold = await pdf.embedFont(Buffer.from(HEEBO_BOLD_B64, "base64"), { subset: true });
  const page = pdf.addPage([595.28, 841.89]);
  const W = 595.28;
  const R = W - 50; // right edge
  const L = 50;
  const ink = rgb(0.1, 0.12, 0.16);
  const grey = rgb(0.4, 0.43, 0.48);
  const line = rgb(0.8, 0.82, 0.86);

  const right = (p: PDFPage, text: string, y: number, size = 11, font = regular, color = ink, x = R) => {
    const v = drawable(text);
    p.drawText(v, { x: x - font.widthOfTextAtSize(v, size), y, size, font, color });
  };
  const left = (text: string, y: number, size = 11, font = regular, color = ink) => {
    page.drawText(drawable(text), { x: L, y, size, font, color });
  };
  const center = (text: string, y: number, size = 11, font = regular, color = ink) => {
    const v = drawable(text);
    page.drawText(v, { x: (W - font.widthOfTextAtSize(v, size)) / 2, y, size, font, color });
  };
  const hr = (y: number) =>
    page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.8, color: line });

  let y = 790;
  // Issuer block (right)
  right(page, d.issuerName, y, 20, bold);
  y -= 22;
  if (d.issuerOwner) {
    right(page, d.issuerOwner, y, 11, regular, grey);
    y -= 16;
  }
  right(page, `עוסק פטור מס׳ ${d.issuerTaxId ?? "—"}`, y, 11, bold);
  y -= 16;
  for (const t of [d.issuerAddress, d.issuerPhone && `טלפון: ${d.issuerPhone}`, d.issuerEmail]) {
    if (t) {
      right(page, t, y, 10, regular, grey);
      y -= 14;
    }
  }

  // Original / copy mark (left)
  const mark = d.copy ? "העתק" : "מקור";
  const mv = drawable(mark);
  const mw = bold.widthOfTextAtSize(mv, 13) + 20;
  page.drawRectangle({ x: L, y: 772, width: mw, height: 24, borderColor: ink, borderWidth: 1 });
  page.drawText(mv, { x: L + 10, y: 779, size: 13, font: bold, color: ink });
  if (d.cancelled) {
    const cv = drawable("מבוטלת");
    page.drawText(cv, { x: L + mw + 12, y: 779, size: 13, font: bold, color: rgb(0.75, 0.1, 0.1) });
  }

  y = Math.min(y, 720) - 14;
  hr(y);
  y -= 40;
  center(`קבלה מס׳ ${d.receiptNumber}`, y, 26, bold);
  y -= 24;
  center(`תאריך: ${d.issueDate}`, y, 12, regular, grey);
  y -= 34;

  // Client
  right(page, "לכבוד", y, 10, regular, grey);
  y -= 18;
  right(page, d.clientName, y, 14, bold);
  y -= 18;
  if (d.clientTaxId) {
    right(page, `ת.ז / ח.פ: ${d.clientTaxId}`, y, 11);
    y -= 15;
  }
  if (d.clientAddress) {
    right(page, d.clientAddress, y, 11);
    y -= 15;
  }

  // Table header
  y -= 20;
  page.drawRectangle({ x: L, y: y - 8, width: R - L, height: 26, color: rgb(0.94, 0.95, 0.97) });
  right(page, "תיאור", y, 11, bold, ink, R - 10);
  left("סכום", y, 11, bold);
  y -= 30;

  // Description rows
  const descLines = wrap(d.description, regular, 11, 340);
  for (const l of descLines) {
    right(page, l, y, 11, regular, ink, R - 10);
    y -= 16;
  }
  const amt = formatAmountIls(d.amount);
  page.drawText(amt, { x: L + 8, y: y + 16 * descLines.length, size: 11, font: regular, color: ink });
  y -= 6;
  hr(y);
  y -= 30;
  right(page, "סה״כ שולם", y, 14, bold, ink, R - 10);
  const tv = formatAmountIls(d.amount);
  page.drawText(tv, { x: L + 8, y, size: 16, font: bold, color: ink });
  y -= 30;
  right(page, "העסק פטור ממע״מ ואינו גובה מע״מ (עוסק פטור).", y, 10, regular, grey);

  // Payment
  y -= 40;
  right(page, `אמצעי תשלום: ${d.paymentMethod}`, y, 12, bold);
  y -= 18;
  if (d.paymentDetails) {
    for (const l of wrap(d.paymentDetails, regular, 11, R - L)) {
      right(page, l, y, 11);
      y -= 15;
    }
  }

  // Signature
  y = Math.min(y - 50, 230);
  page.drawLine({ start: { x: L, y }, end: { x: L + 170, y }, thickness: 0.8, color: ink });
  left("חתימה", y - 15, 10, regular, grey);
  right(page, "הופק במערכת Bizly", y - 15, 9, regular, grey);

  const footer = d.footer?.trim();
  if (footer) {
    let fy = 90;
    for (const l of wrap(footer, regular, 9, R - L)) {
      center(l, fy, 9, regular, grey);
      fy -= 12;
    }
  }
  return pdf.save();
}
