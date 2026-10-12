import { Button } from "@/components/ui/button";
import Link from "next/link";

export function EmptyState({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900/30">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {primaryHref && primaryLabel ? (
          <Button asChild variant="income">
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
        ) : null}
        {secondaryHref && secondaryLabel ? (
          <Button asChild variant="expense">
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
