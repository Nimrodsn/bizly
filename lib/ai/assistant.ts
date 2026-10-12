import { getAIProvider } from "@/lib/ai/provider";
import { getMonthlyIncome, getTurnoverProgress, getExpenseBreakdown } from "@/lib/ai/tools";
import { requireBusinessContext } from "@/lib/auth/context";

function detectIntent(message: string): "monthly_income" | "turnover" | "expenses" | "general" {
  const m = message.toLowerCase();
  if (m.includes("הכנס") && m.includes("חודש")) return "monthly_income";
  if (m.includes("תקר") || m.includes("מחזור")) return "turnover";
  if (m.includes("הוצא")) return "expenses";
  return "general";
}

export async function runAssistant(message: string) {
  const ctx = await requireBusinessContext();
  const intent = detectIntent(message);
  const now = new Date();

  if (intent === "monthly_income") {
    const result = await getMonthlyIncome({
      businessId: ctx.businessId,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });
    return {
      answer: `בחודש הנוכחי היו לך הכנסות בסך ₪${result.total.toLocaleString("he-IL")}.`,
      source: `מבוסס על ${result.transactionCount} עסקאות`,
    };
  }

  if (intent === "turnover") {
    const result = await getTurnoverProgress({
      businessId: ctx.businessId,
      taxYear: ctx.business.tax_year,
    });
    const remaining =
      result.ceiling != null ? Math.max(0, result.ceiling - result.turnover) : null;
    return {
      answer: `מחזור ${ctx.business.tax_year}: ₪${result.turnover.toLocaleString("he-IL")}${
        result.ceiling != null
          ? `, נותרו ₪${remaining?.toLocaleString("he-IL")} מתוך תקרת ₪${result.ceiling.toLocaleString("he-IL")}.`
          : "."
      }`,
      source: `מבוסס על ${result.transactionCount} עסקאות`,
    };
  }

  if (intent === "expenses") {
    const start = `${now.getFullYear()}-01-01`;
    const end = now.toISOString().slice(0, 10);
    const result = await getExpenseBreakdown({
      businessId: ctx.businessId,
      startDate: start,
      endDate: end,
    });
    return {
      answer: `מתחילת השנה הוצאת ₪${result.total.toLocaleString("he-IL")}.`,
      source: `מבוסס על ${result.transactionCount} עסקאות`,
    };
  }

  const provider = getAIProvider();
  if (!provider) {
    return {
      answer: "שאל אותי על הכנסות, הוצאות או מחזור — אענה על בסיס הנתונים שלך.",
      source: "מקור: מסד הנתונים",
    };
  }

  const turnover = await getTurnoverProgress({
    businessId: ctx.businessId,
    taxYear: ctx.business.tax_year,
  });
  const prompt = `User question: ${message}\nData snapshot: ${JSON.stringify(turnover)}`;
  const content = await provider.analyzeFinancialData(prompt);
  return { answer: content, source: "מבוסס על נתוני העסק שלך" };
}
