import { daysInYear, dayOfYear } from "@/lib/format";

export type IncomeRow = {
  amount: number;
  status: string;
  transaction_date: string;
};

export function sumTurnover(
  rows: IncomeRow[],
  year: number,
  includeStatuses: string[] = ["received", "refunded"],
): number {
  return rows
    .filter((r) => {
      const y = new Date(r.transaction_date).getFullYear();
      return y === year && includeStatuses.includes(r.status);
    })
    .reduce((acc, r) => {
      if (r.status === "refunded") return acc - r.amount;
      return acc + r.amount;
    }, 0);
}

export function forecastAnnualTurnover(
  turnoverToDate: number,
  referenceDate: Date,
): { forecast: number | null; avgMonthly: number | null; elapsedDays: number } {
  const year = referenceDate.getFullYear();
  const elapsed = dayOfYear(referenceDate);
  if (elapsed <= 0 || turnoverToDate <= 0) {
    return { forecast: null, avgMonthly: null, elapsedDays: elapsed };
  }
  const totalDays = daysInYear(year);
  const forecast = (turnoverToDate / elapsed) * totalDays;
  const monthsElapsed = referenceDate.getMonth() + 1;
  const avgMonthly = turnoverToDate / monthsElapsed;
  return { forecast, avgMonthly, elapsedDays: elapsed };
}

export function turnoverProgressPercent(turnover: number, ceiling: number): number {
  if (ceiling <= 0) return 0;
  return Math.min(100, (turnover / ceiling) * 100);
}

export type TurnoverWarningLevel = "normal" | "info" | "warning" | "strong" | "critical";

export function turnoverWarningLevel(percent: number): TurnoverWarningLevel {
  if (percent >= 100) return "critical";
  if (percent >= 90) return "strong";
  if (percent >= 75) return "warning";
  if (percent >= 50) return "info";
  return "normal";
}
