import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { CommandSearch } from "@/components/shell/command-search";
import { t } from "@/lib/i18n/he";
import Link from "next/link";

export function TopBar({ businessName }: { businessName: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="lg:hidden">
        <p className="font-semibold">Bizly</p>
        <p className="text-xs text-slate-500">{businessName}</p>
      </div>
      <div className="hidden text-sm text-slate-500 lg:block">{businessName}</div>
      <CommandSearch />
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="sm">
          <Link href="/notifications">התראות</Link>
        </Button>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm">
            {t("auth.logout")}
          </Button>
        </form>
      </div>
    </header>
  );
}
