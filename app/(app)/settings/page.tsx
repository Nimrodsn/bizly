import Link from "next/link";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { deleteAccountAction } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/settings/business", label: "פרטי עסק" },
  { href: "/settings/activities", label: "תחומי פעילות" },
  { href: "/settings/categories", label: "קטגוריות הוצאה" },
  { href: "/settings/appearance", label: "מראה" },
  { href: "/settings/export", label: "ייצוא כל הנתונים" },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHeader title="הגדרות" />
      {links.map((l) => (
        <Link key={l.href} href={l.href}>
          <Card>
            <CardContent className="py-4">{l.label}</CardContent>
          </Card>
        </Link>
      ))}
      <Card className="border-red-200">
        <CardContent className="space-y-3 py-4">
          <p className="text-sm font-medium text-red-700">מחיקת חשבון</p>
          <p className="text-xs text-slate-500">פעולה זו תמחק את נתוני העסק והמסמכים.</p>
          <form action={deleteAccountAction}>
            <input type="hidden" name="confirm" value="DELETE" />
            <Button type="submit" variant="destructive" size="sm">
              מחק חשבון
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
