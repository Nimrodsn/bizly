"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createExpenseAction } from "@/lib/actions/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { userErrorMessage } from "@/lib/errors";
import { todayIsoDate } from "@/lib/format";
import { t } from "@/lib/i18n/he";

type Option = { id: string; name: string };

export function ExpenseForm({
  categories,
  paymentMethods,
  suppliers,
  defaultDate = todayIsoDate(),
}: {
  categories: Option[];
  paymentMethods: Option[];
  suppliers: Option[];
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
            await createExpenseAction(fd);
            toast.success(t("toast.expenseAdded"));
            router.push("/expenses");
            router.refresh();
          } catch (err) {
            toast.error(userErrorMessage(err));
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="amount">סכום (₪)</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category_id">קטגוריה</Label>
        <select
          id="category_id"
          name="category_id"
          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="supplier_id">ספק</Label>
        <select
          id="supplier_id"
          name="supplier_id"
          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="">—</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
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
        <Label htmlFor="expense_date">תאריך</Label>
        <Input id="expense_date" name="expense_date" type="date" defaultValue={defaultDate} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">תיאור</Label>
        <Input id="description" name="description" placeholder="למשל: Decathlon" />
      </div>
      <Button type="submit" variant="expense" className="w-full" disabled={pending}>
        {t("actions.save")}
      </Button>
    </form>
  );
}
