"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { issueReceiptAction } from "@/lib/actions/receipts";
import { PAYMENT_METHODS } from "@/lib/receipts/constants";
import { userErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ClientOption = {
  id: string;
  name: string;
  tax_id: string | null;
  address: string | null;
  email: string | null;
};

const selectCls =
  "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950";

export function ReceiptForm({
  clients,
  today,
  nextNumber,
}: {
  clients: ClientOption[];
  today: string;
  nextNumber: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0]);

  function pickClient(id: string) {
    setClientId(id);
    const c = clients.find((x) => x.id === id);
    if (c) {
      setName(c.name);
      setTaxId(c.tax_id ?? "");
      setAddress(c.address ?? "");
      setEmail(c.email ?? "");
    } else {
      setName("");
      setTaxId("");
      setAddress("");
      setEmail("");
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            const { id } = await issueReceiptAction(fd);
            toast.success("הקבלה הונפקה");
            router.push(`/receipts/${id}`);
            router.refresh();
          } catch (err) {
            toast.error(userErrorMessage(err, "הנפקת הקבלה נכשלה. נסה שוב."));
          }
        });
      }}
    >
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        מספר הקבלה הבא: <span className="font-semibold">{nextNumber}</span>
      </p>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-semibold">לקוח</legend>
        <div className="space-y-2">
          <Label htmlFor="client_pick">בחירת לקוח</Label>
          <select
            id="client_pick"
            className={selectCls}
            value={clientId}
            onChange={(e) => pickClient(e.target.value)}
          >
            <option value="">+ לקוח חדש</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input type="hidden" name="client_id" value={clientId} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client_name">שם הלקוח</Label>
          <Input id="client_name" name="client_name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="client_tax_id">ת.ז / ח.פ / עוסק (אופציונלי)</Label>
            <Input
              id="client_tax_id"
              name="client_tax_id"
              inputMode="numeric"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client_email">אימייל (אופציונלי)</Label>
            <Input
              id="client_email"
              name="client_email"
              type="email"
              dir="ltr"
              className="text-right"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="client_address">כתובת (אופציונלי)</Label>
          <Input id="client_address" name="client_address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        {!clientId ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="save_client" defaultChecked className="h-4 w-4" />
            שמור כלקוח לשימוש חוזר
          </label>
        ) : null}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-semibold">פרטי הקבלה</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="issue_date">תאריך</Label>
            <Input id="issue_date" name="issue_date" type="date" required defaultValue={today} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">סכום (₪)</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required inputMode="decimal" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">תיאור השירות</Label>
          <textarea
            id="description"
            name="description"
            required
            rows={3}
            placeholder="למשל: אימוני נוער - חודש נובמבר 2026"
            className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="payment_method">אמצעי תשלום</Label>
            <select
              id="payment_method"
              name="payment_method"
              className={selectCls}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_details">
              {method === "צ׳ק" ? "מספר צ׳ק, בנק וסניף" : method === "העברה בנקאית" ? "אסמכתא / פרטי העברה" : "פרטים (אופציונלי)"}
            </Label>
            <Input id="payment_details" name="payment_details" />
          </div>
        </div>
      </fieldset>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "מנפיק..." : "הנפק קבלה"}
      </Button>
      <p className="text-xs text-slate-500">לאחר ההנפקה לא ניתן לערוך את הקבלה. ניתן רק לבטל אותה.</p>
    </form>
  );
}
