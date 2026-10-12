import { describe, expect, it } from "vitest";
import {
  forecastAnnualTurnover,
  sumTurnover,
  turnoverProgressPercent,
  turnoverWarningLevel,
} from "@/lib/calculations/turnover";
import { formatIls } from "@/lib/format";
import { normalizedExpenses } from "@/lib/calculations/small-business";

describe("turnover", () => {
  it("sums received income for year", () => {
    const total = sumTurnover(
      [
        { amount: 200, status: "received", transaction_date: "2026-03-01" },
        { amount: 100, status: "cancelled", transaction_date: "2026-03-02" },
        { amount: 50, status: "refunded", transaction_date: "2026-04-01" },
      ],
      2026,
    );
    expect(total).toBe(150);
  });

  it("forecasts annual turnover", () => {
    const ref = new Date("2026-10-01T12:00:00");
    const { forecast } = forecastAnnualTurnover(9000, ref);
    expect(forecast).toBeGreaterThan(9000);
  });

  it("warning levels", () => {
    expect(turnoverWarningLevel(40)).toBe("normal");
    expect(turnoverWarningLevel(80)).toBe("warning");
    expect(turnoverWarningLevel(100)).toBe("critical");
  });

  it("progress percent caps at 100", () => {
    expect(turnoverProgressPercent(150000, 122833)).toBe(100);
  });
});

describe("format and small business", () => {
  it("formats ILS", () => {
    expect(formatIls(200)).toContain("200");
  });

  it("30% normalized expenses", () => {
    expect(normalizedExpenses(50000, 0.3)).toBe(15000);
  });
});
