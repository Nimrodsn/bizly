"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus,
  FileText,
  LayoutDashboard,
  Receipt,
  Settings,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Landmark,
  BarChart3,
  Truck,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/he";

const items = [
  { href: "/receipts", label: "קבלות", icon: FileText },
  { href: "/receipts/new", label: "קבלה חדשה", icon: Plus },
  { href: "/clients", label: "לקוחות", icon: Users },
  { href: "/income", label: "הכנסות", icon: TrendingUp },
  { href: "/expenses", label: "הוצאות", icon: TrendingDown },
  { href: "/dashboard", label: "סיכום", icon: LayoutDashboard },
  { href: "/settings", label: "הגדרות", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-l border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/80 lg:block">
      <div className="mb-8 px-2">
        <p className="text-lg font-semibold tracking-tight">Bizly</p>
        <p className="text-xs text-slate-500">קבלות לעוסק פטור</p>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/receipts" && href !== "/receipts/new" ? pathname.startsWith(`${href}/`) : href === "/receipts" ? pathname.startsWith("/receipts/") && pathname !== "/receipts/new" : false);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
