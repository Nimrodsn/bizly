"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateBusinessAction } from "@/lib/actions/business";
import { userErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type BusinessValues = {
  name: string;
  owner_name: string | null;
  tax_id: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  receipt_prefix: string;
  receipt_next_number: number;
  receipt_footer: string | null;
};

export function BusinessForm({ b, numberingLocked }: { b: BusinessValues; numberingLocked: boolean }) {
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          try {
            await updateBusinessAction(fd);
            toast.success("הפרטים נשמרו");
          } catch (err) {
            toast.error(userErrorMessage(err));
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="name">שם העסק (מופיע בקבלה)</Label>
        <Input id="name" name="name" required defaultValue={b.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="owner_name">שם בעל העסק</Label>
        <Input id="owner_name" name="owner_name" defaultValue={b.owner_name ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tax_id">מספר עוסק פטור (ת.ז.)</Label>
        <Input id="tax_id" name="tax_id" inputMode="numeric" defaultValue={b.tax_id ?? ""} placeholder="9 ספרות" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">כתובת</Label>
        <Input id="address" name="address" defaultValue={b.address ?? ""} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">טלפון</Label>
          <Input id="phone" name="phone" inputMode="tel" defaultValue={b.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">אימייל</Label>
          <Input id="email" name="email" type="email" dir="ltr" className="text-right" defaultValue={b.email ?? ""} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="receipt_prefix">תחילית למספר קבלה (אופציונלי)</Label>
          <Input id="receipt_prefix" name="receipt_prefix" defaultValue={b.receipt_prefix} disabled={numberingLocked} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="receipt_next_number">מספר הקבלה הבא</Label>
          <Input
            id="receipt_next_number"
            name="receipt_next_number"
            type="number"
            min={1}
            defaultValue={b.receipt_next_number}
            disabled={numberingLocked}
          />
        </div>
      </div>
      {numberingLocked ? (
        <p className="text-xs text-slate-500">לאחר הנפקת קבלה ראשונה לא ניתן לשנות את המספור, כדי לשמור על רצף.</p>
      ) : (
        <p className="text-xs text-slate-500">אם כבר הנפקת קבלות בעבר, הזן את המספר הבא ברצף. אחרי הקבלה הראשונה המספור ננעל.</p>
      )}
      <div className="space-y-2">
        <Label htmlFor="receipt_footer">הערה בתחתית הקבלה (אופציונלי)</Label>
        <textarea
          id="receipt_footer"
          name="receipt_footer"
          rows={2}
          defaultValue={b.receipt_footer ?? ""}
          className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "שומר..." : "שמור"}
      </Button>
    </form>
  );
}
