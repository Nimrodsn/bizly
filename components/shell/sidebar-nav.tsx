"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
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
  { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
  { href: "/transactions", label: t("nav.transactions"), icon: Receipt },
  { href: "/income", label: t("nav.income"), icon: TrendingUp },
  { href: "/expenses", label: t("nav.expenses"), icon: TrendingDown },
  { href: "/clients", label: t("nav.clients"), icon: Users },
  { href: "/suppliers", label: t("nav.suppliers"), icon: Truck },
  { href: "/documents", label: t("nav.documents"), icon: FolderOpen },
  { href: "/cashflow", label: t("nav.cashflow"), icon: Wallet },
  { href: "/reports", label: t("nav.reports"), icon: BarChart3 },
  { href: "/training-fund", label: t("nav.trainingFund"), icon: Landmark },
  { href: "/tax", label: t("nav.tax"), icon: FileText },
  { href: "/ai", label: t("nav.ai"), icon: Bot },
  { href: "/settings", label: t("nav.settings"), icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-l border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/80 lg:block">
      <div className="mb-8 px-2">
        <p className="text-lg font-semibold tracking-tight">Bizly</p>
        <p className="text-xs text-slate-500">{t("app.tagline")}</p>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
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
