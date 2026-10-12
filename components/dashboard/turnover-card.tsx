import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatIls, formatPercent } from "@/lib/format";
import { turnoverWarningLevel } from "@/lib/calculations/turnover";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/he";

export function TurnoverCard({
  taxYear,
  turnover,
  ceiling,
  forecast,
  avgMonthly,
}: {
  taxYear: number;
  turnover: number;
  ceiling: number | null;
  forecast: number | null;
  avgMonthly: number | null;
}) {
  const percent = ceiling ? Math.min(100, (turnover / ceiling) * 100) : 0;
  const level = turnoverWarningLevel(percent);
  const indicatorClass =
    level === "critical" || level === "strong"
      ? "bg-red-600"
      : level === "warning"
        ? "bg-orange-500"
        : "bg-indigo-600";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t("dashboard.turnoverWidget")} {taxYear}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-2xl font-semibold">{formatIls(turnover)}</p>
          {ceiling != null ? (
            <p className="text-sm text-slate-500">
              {t("dashboard.ofCeiling")} {formatIls(ceiling)} · {formatPercent(percent)}
            </p>
          ) : null}
        </div>
        {ceiling != null ? (
          <Progress value={percent} indicatorClassName={indicatorClass} />
        ) : null}
        {ceiling != null ? (
          <p className={cn("text-sm", level !== "normal" && "font-medium text-orange-600")}>
            {t("dashboard.remaining")}: {formatIls(Math.max(0, ceiling - turnover))}
          </p>
        ) : null}
        {avgMonthly != null ? (
          <p className="text-xs text-slate-500">
            {t("dashboard.avgMonthly")}: {formatIls(avgMonthly)}
          </p>
        ) : null}
        {forecast != null ? (
          <p className="text-xs text-slate-500">
            {t("dashboard.forecast")}: {formatIls(forecast)}
          </p>
        ) : (
          <p className="text-xs text-slate-500">{t("dashboard.insufficientForecast")}</p>
        )}
      </CardContent>
    </Card>
  );
}
