const ilsFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatIls(amount: number): string {
  return ilsFormatter.format(amount);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatDateHe(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysInYear(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

export function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
