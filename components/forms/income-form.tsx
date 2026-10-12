"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createIncomeAction } from "@/lib/actions/income";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { userErrorMessage } from "@/lib/errors";
import { todayIsoDate } from "@/lib/format";
import { t } from "@/lib/i18n/he";

type Option = { id: string; name: string };

export function IncomeForm({
  activities,
  paymentMethods,
  clients,
  defaultDate = todayIsoDate(),
}: {
  activities: Option[];
  paymentMethods: Option[];
  clients: Option[];
  defaultDate?: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            await createIncomeAction(fd);
            toast.success(t("toast.incomeAdded"));
            router.push("/income");
            router.refresh();
          } catch (err) {
            toast.error(userErrorMessage(err));
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="amount">סכום (₪)</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0" required inputMode="decimal" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="activity_id">תחום פעילות</Label>
        <select
          id="activity_id"
          name="activity_id"
          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="">—</option>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="payment_method_id">אמצעי תשלום</Label>
        <select
          id="payment_method_id"
          name="payment_method_id"
          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="">—</option>
          {paymentMethods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="client_id">לקוח (אופציונלי)</Label>
        <select
          id="client_id"
          name="client_id"
          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="">—</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="transaction_date">תאריך</Label>
        <Input id="transaction_date" name="transaction_date" type="date" defaultValue={defaultDate} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">תיאור</Label>
        <Input id="description" name="description" placeholder="למשל: שיעור מתמטיקה" />
      </div>
      <Button type="submit" variant="income" className="w-full" disabled={pending}>
        {t("actions.save")}
      </Button>
    </form>
  );
}
