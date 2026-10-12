import Link from "next/link";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, FolderOpen, Users, Truck } from "lucide-react";

const items = [
  { href: "/income/new", label: "הכנסה", icon: TrendingUp, color: "text-emerald-600" },
  { href: "/expenses/new", label: "הוצאה", icon: TrendingDown, color: "text-orange-600" },
  { href: "/documents", label: "מסמך / סריקה", icon: FolderOpen, color: "text-indigo-600" },
  { href: "/clients", label: "לקוח", icon: Users, color: "text-slate-600" },
  { href: "/suppliers", label: "ספק", icon: Truck, color: "text-slate-600" },
];

export default function QuickAddPage() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="הוסף" />
      <div className="grid gap-3">
        {items.map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href}>
            <Card className="transition hover:border-indigo-200 hover:shadow-md">
              <CardContent className="flex items-center gap-3 py-4">
                <Icon className={`h-5 w-5 ${color}`} />
                <span className="font-medium">{label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
