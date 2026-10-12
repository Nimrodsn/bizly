import { PageHeader } from "@/components/shell/page-header";
import Link from "next/link";

export default function ExportSettingsPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 text-sm">
      <PageHeader title="ייצוא כל הנתונים" />
      <ul className="list-inside list-disc space-y-2 text-indigo-600">
        <li>
          <Link href="/api/export?type=income&format=csv">הכנסות CSV</Link>
        </li>
        <li>
          <Link href="/api/export?type=expense&format=csv">הוצאות CSV</Link>
        </li>
        <li>
          <Link href="/api/export/accountant">חבילת רואה חשבון</Link>
        </li>
      </ul>
    </div>
  );
}
