"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ReceiptButton({ incomeId }: { incomeId: string }) {
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/receipts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incomeId }),
      });
      if (!res.ok) throw new Error("receipt");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "receipt.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={generate} disabled={loading}>
      הפק קבלה
    </Button>
  );
}
