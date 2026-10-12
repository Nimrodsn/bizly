export const he = {
  app: {
    name: "Bizly",
    tagline: "ניהול עסק פשוט וחכם",
  },
  auth: {
    loginTitle: "ברוך הבא ל-Bizly",
    loginSubtitle: "התחבר עם Google כדי לנהל את העסק שלך",
    loginButton: "התחבר עם Google",
    logout: "התנתק",
  },
  nav: {
    dashboard: "דשבורד",
    transactions: "תנועות",
    income: "הכנסות",
    expenses: "הוצאות",
    clients: "לקוחות",
    suppliers: "ספקים",
    documents: "מסמכים",
    reports: "דוחות",
    trainingFund: "קרן השתלמות",
    tax: "מיסוי",
    cashflow: "תזרים",
    ai: "AI Assistant",
    settings: "הגדרות",
    add: "הוסף",
    more: "עוד",
    home: "ראשי",
  },
  dashboard: {
    welcome: "ברוך הבא",
    welcomeSubtitle: "נתחיל מתנועה ראשונה בעסק.",
    addIncome: "הוסף הכנסה",
    addExpense: "הוסף הוצאה",
    checklistActivity: "הוסף תחום פעילות",
    checklistIncome: "הוסף הכנסה ראשונה",
    checklistExpense: "הוסף הוצאה ראשונה",
    checklistTraining: "הגדר קרן השתלמות",
    checklistTurnover: "בדוק תקרת עוסק פטור",
    monthIncome: "הכנסות החודש",
    monthExpenses: "הוצאות החודש",
    monthNet: "תזרים נטו",
    turnover: "מחזור שנתי",
    turnoverWidget: "מחזור",
    ofCeiling: "מתוך",
    remaining: "נותר",
    avgMonthly: "מחזור חודשי ממוצע",
    forecast: "תחזית מחזור שנתי",
    insufficientForecast: "אין עדיין מספיק נתונים לתחזית אמינה.",
  },
  tax: {
    disclaimer:
      "הנתונים והחישובים באפליקציה הם כלי עזר בלבד ואינם מהווים ייעוץ מס, חשבונאות או ייעוץ משפטי. יש לוודא את הנתונים והחובות מול רשות המסים או איש מקצוע מוסמך.",
    dataForYear: "נתוני מס לשנת",
    noConfig: "אין כרגע הגדרת מס מאומתת לשנת המס הזו.",
    smallBusinessTitle: "בעל עסק זעיר",
    turnover: "מחזור",
    recordedExpenses: "הוצאות שנרשמו",
    normalizedExpenses: "הוצאות נורמטיביות",
    estimatedIncome: "הכנסה עסקית לפי המסלול",
    actualVsNormalized: "הוצאות בפועל לעומת הוצאות נורמטיביות",
    analysisOnly:
      "לצורך ניתוח בלבד. יש לדון עם איש מקצוע לפני קבלת החלטות מס.",
    trainingFundDisclaimer:
      "זהו חישוב עזר בלבד ואינו מהווה ייעוץ מס.",
  },
  actions: {
    save: "שמור",
    cancel: "ביטול",
    delete: "מחק",
    edit: "ערוך",
    duplicate: "שכפל",
    confirm: "אשר",
    review: "עבור על פריטים",
    markReviewed: "סמן חודש כנסקר",
  },
  toast: {
    saved: "נשמר בהצלחה",
    incomeAdded: "ההכנסה נוספה",
    expenseAdded: "ההוצאה נוספה",
    documentAnalyzed: "המסמך נותח בהצלחה",
    reviewExtracted: "מצאנו כמה פרטים שצריך לאשר",
    noTransactions: "אין עדיין תנועות",
    firstIncome: "זה הזמן להוסיף את ההכנסה הראשונה שלך",
  },
  onboarding: {
    title: "הגדרת העסק",
    stepBusiness: "שם העסק",
    stepActivities: "תחומי פעילות",
    stepTax: "סטטוס מע\"מ",
    stepIncomeTax: "מסלול מס הכנסה",
    stepTaxYear: "שנת מס",
    stepTraining: "קרן השתלמות (אופציונלי)",
    taxNote: "זו הגדרה ראשונית בלבד. ניתן לשנות מאוחר יותר.",
    skip: "דלג",
    finish: "סיים והמשך",
    defaultActivityMath: "מתמטיקה",
    defaultActivityFitness: "כושר גופני",
    exemptDealer: "עוסק פטור",
    smallBusiness: "בעל עסק זעיר",
  },
} as const;

export type Messages = typeof he;

export function t(path: string): string {
  const parts = path.split(".");
  let cur: unknown = he;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return path;
    }
  }
  return typeof cur === "string" ? cur : path;
}
