export const USER_ERRORS = {
  generic: "לא ניתן לשמור את הנתונים כרגע. נסה שוב.",
  unauthorized: "יש להתחבר כדי להמשיך.",
  notFound: "הפריט לא נמצא.",
  validation: "יש לתקן את השדות המסומנים.",
  upload: "העלאת הקובץ נכשלה. נסה שוב.",
  ai: "שירות ה-AI אינו זמין כרגע. נסה שוב מאוחר יותר.",
} as const;

export function userErrorMessage(error: unknown, fallback: string = USER_ERRORS.generic): string {
  if (error instanceof Error && error.message.startsWith("USER:")) {
    return error.message.replace(/^USER:\s*/, "");
  }
  return fallback;
}
