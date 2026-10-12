import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const reports = [
  { id: "income", title: "דוח הכנסות" },
  { id: "expense", title: "דוח הוצאות" },
  { id: "turnover", title: "מחזור שנתי" },
  { id: "tax", title: "סיכום מס" },
];

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="דוחות" description="ייצוא CSV / XLSX" />
      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="text-base">{r.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 text-sm">
              <Link className="text-indigo-600 underline" href={`/api/export?type=${r.id === "expense" ? "expense" : "income"}&format=csv`}>
                CSV
              </Link>
              <Link className="text-indigo-600 underline" href={`/api/export?type=${r.id === "expense" ? "expense" : "income"}&format=xlsx`}>
                XLSX
              </Link>
              <Link className="text-indigo-600 underline" href="/tax">
                צפייה
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>ייצוא לרואה חשבון</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          <Link href="/api/export/accountant" className="text-indigo-600 underline">
            הורד חבילת ZIP (CSV + סיכומים)
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
