import { requireBusinessContext } from "@/lib/auth/context";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { MobileNav } from "@/components/shell/mobile-nav";
import { TopBar } from "@/components/shell/top-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireBusinessContext();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] lg:flex-row-reverse">
      <SidebarNav />
      <div className="flex min-h-screen flex-1 flex-col pb-20 lg:pb-0">
        <TopBar businessName={ctx.business.name} />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
