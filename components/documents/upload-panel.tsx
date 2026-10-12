"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { todayIsoDate } from "@/lib/format";

type Extraction = {
  supplier?: string;
  date?: string;
  totalAmount?: number;
  description?: string;
  category?: string;
  confidence?: number;
};

export function UploadPanel() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [fields, setFields] = useState<Extraction | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onFile(file: File) {
    setLoading(true);
    setFields(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const uploadRes = await fetch("/api/documents/upload", { method: "POST", body: form });
      if (!uploadRes.ok) throw new Error("upload");
      const uploadJson = (await uploadRes.json()) as { documentId: string };
      setDocumentId(uploadJson.documentId);
      const extractRes = await fetch("/api/documents/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: uploadJson.documentId }),
      });
      const extractJson = (await extractRes.json()) as { extraction?: Extraction };
      setFields(extractJson.extraction ?? { confidence: 0 });
      toast.success("המסמך נותח — יש לאשר לפני שמירה");
    } catch {
      toast.error("העלאת הקובץ נכשלה");
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    if (!documentId || !fields) return;
    setSaving(true);
    try {
      const res = await fetch("/api/documents/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, ...fields }),
      });
      if (!res.ok) throw new Error("save");
      toast.success("ההוצאה נוספה");
      setFields(null);
      setPreview(null);
      router.refresh();
    } catch {
      toast.error("לא ניתן לשמור את הנתונים כרגע. נסה שוב.");
    } finally {
      setSaving(false);
    }
  }

  const lowConfidence = (fields?.confidence ?? 1) < 0.7;

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        className="w-full text-sm"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setPreview(URL.createObjectURL(file));
            void onFile(file);
          }
        }}
      />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="תצוגה מקדימה" className="max-h-64 rounded-lg border" />
      ) : null}
      {fields ? (
        <div
          className={`space-y-3 rounded-lg border p-4 text-sm ${
            lowConfidence
              ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
              : "border-slate-200"
          }`}
        >
          <p className="font-medium">מצאנו כמה פרטים שצריך לאשר</p>
          {lowConfidence ? <p className="text-xs text-amber-700">ביטחון נמוך — בדוק את השדות</p> : null}
          <div>
            <Label htmlFor="supplier">ספק</Label>
            <Input
              id="supplier"
              value={fields.supplier ?? ""}
              onChange={(e) => setFields({ ...fields, supplier: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="date">תאריך</Label>
            <Input
              id="date"
              type="date"
              value={fields.date ?? todayIsoDate()}
              onChange={(e) => setFields({ ...fields, date: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="total">סכום</Label>
            <Input
              id="total"
              type="number"
              value={fields.totalAmount ?? ""}
              onChange={(e) => setFields({ ...fields, totalAmount: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="desc">תיאור</Label>
            <Input
              id="desc"
              value={fields.description ?? ""}
              onChange={(e) => setFields({ ...fields, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="category">קטגוריה מוצעת</Label>
            <Input
              id="category"
              value={fields.category ?? ""}
              onChange={(e) => setFields({ ...fields, category: e.target.value })}
            />
          </div>
          <Button type="button" onClick={approve} disabled={saving}>
            אישור ושמירה
          </Button>
        </div>
      ) : null}
      {loading ? <p className="text-sm text-slate-500">מעלה ומנתח...</p> : null}
    </div>
  );
}
