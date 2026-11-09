"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cancelReceiptAction, emailReceiptAction } from "@/lib/actions/receipts";
import { userErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReceiptActions({
  id,
  number,
  cancelled,
  clientEmail,
  emailEnabled,
  issuer,
}: {
  id: string;
  number: string;
  cancelled: boolean;
  clientEmail: string;
  emailEnabled: boolean;
  issuer: string;
}) {
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState(clientEmail);
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function share() {
    try {
      const res = await fetch(`/api/receipts/${id}/pdf`);
      if (!res.ok) throw new Error("fetch");
      const blob = await res.blob();
      const file = new File([blob], `receipt-${number}.pdf`, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `קבלה מס׳ ${number}` });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.info("השיתוף לא נתמך במכשיר זה. הקובץ הורד.");
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") toast.error("השיתוף נכשל.");
    }
  }

  const subject = encodeURIComponent(`קבלה מס׳ ${number} מאת ${issuer}`);
  const body = encodeURIComponent(`שלום,\nמצורפת קבלה מס׳ ${number}.\n\nבברכה,\n${issuer}`);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <a href={`/api/receipts/${id}/pdf`}>הורדת מקור (PDF)</a>
        </Button>
        <Button asChild variant="outline">
          <a href={`/api/receipts/${id}/pdf?copy=1`}>הורדת העתק</a>
        </Button>
        <Button type="button" variant="outline" onClick={share}>
          שיתוף
        </Button>
      </div>

      <div className="space-y-2 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <p className="text-sm font-medium">שליחה במייל</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            dir="ltr"
            className="text-right"
            placeholder="כתובת אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {emailEnabled ? (
            <Button
              type="button"
              disabled={pending || !email}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await emailReceiptAction(id, email);
                    toast.success("הקבלה נשלחה");
                  } catch (e) {
                    toast.error(userErrorMessage(e, "שליחת האימייל נכשלה."));
                  }
                })
              }
            >
              שלח PDF
            </Button>
          ) : (
            <Button asChild variant="outline">
              <a href={`mailto:${email}?subject=${subject}&body=${body}`}>פתח טיוטת מייל</a>
            </Button>
          )}
        </div>
        {!emailEnabled ? (
          <p className="text-xs text-slate-500">שליחה אוטומטית עם קובץ מצורף עדיין לא הוגדרה. הורד את הקובץ וצרף אותו לטיוטה, או השתמש בכפתור השיתוף.</p>
        ) : null}
      </div>

      {!cancelled ? (
        <div className="space-y-2 rounded-lg border border-red-200 p-4 dark:border-red-900">
          <p className="text-sm font-medium text-red-700">ביטול קבלה</p>
          {!confirming ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>
              בטל קבלה זו
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">הקבלה תסומן כמבוטלת ותישאר ברצף המספרים. לא ניתן לבטל את הביטול.</p>
              <Input placeholder="סיבת הביטול" value={reason} onChange={(e) => setReason(e.target.value)} />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={pending || reason.trim().length < 2}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await cancelReceiptAction(id, reason);
                        toast.success("הקבלה בוטלה");
                        setConfirming(false);
                      } catch (e) {
                        toast.error(userErrorMessage(e, "ביטול הקבלה נכשל."));
                      }
                    })
                  }
                >
                  אשר ביטול
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                  חזרה
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
