export function normalizedExpenses(turnover: number, rate: number): number {
  return turnover * rate;
}

export function estimatedTaxableBusinessIncome(
  turnover: number,
  normalizedExpenseAmount: number,
): number {
  return Math.max(0, turnover - normalizedExpenseAmount);
}

export function actualVsNormalizedMessage(actual: number, normalized: number): string {
  if (normalized > actual) {
    return "לצורך ניתוח בלבד, ההוצאה הנורמטיבית גבוהה מההוצאות שתיעדת.";
  }
  if (actual > normalized) {
    return "לצורך ניתוח בלבד, ההוצאות שתיעדת גבוהות מההוצאה הנורמטיבית.";
  }
  return "ההוצאות בפועל שוות להוצאה הנורמטיבית.";
}
