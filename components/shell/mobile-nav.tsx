"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, Receipt, BarChart3, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/he";

const main = [
  { href: "/dashboard", label: t("nav.home"), icon: LayoutDashboard },
  { href: "/transactions", label: t("nav.transactions"), icon: Receipt },
  { href: "/quick-add", label: t("nav.add"), icon: Plus, highlight: true },
  { href: "/reports", label: t("nav.reports"), icon: BarChart3 },
  { href: "/settings", label: t("nav.more"), icon: MoreHorizontal },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {main.map(({ href, label, icon: Icon, highlight }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-[4rem] flex-1 flex-col items-center gap-1 py-2 text-[10px]",
                highlight && "-mt-3",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  highlight
                    ? "bg-indigo-600 text-white shadow-lg"
                    : active
                      ? "text-indigo-600"
                      : "text-slate-500",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className={active ? "font-medium text-indigo-600" : "text-slate-500"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
