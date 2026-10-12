import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  hint,
  tone = "neutral",
}: {
  title: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "income" | "expense" | "brand";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-2xl font-semibold tracking-tight",
            tone === "income" && "text-emerald-600",
            tone === "expense" && "text-orange-600",
            tone === "brand" && "text-indigo-600",
          )}
        >
          {value}
        </p>
        {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
