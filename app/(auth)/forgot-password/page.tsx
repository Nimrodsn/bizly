import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">איפוס סיסמה</CardTitle>
          <CardDescription>נשלח לך באימייל קישור לבחירת סיסמה חדשה</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-emerald-700">
                אם האימייל רשום במערכת, נשלח אליו קישור לאיפוס סיסמה. הקישור תקף לזמן מוגבל - כדאי לבדוק גם בתיקיית הספאם.
              </p>
              <Link href="/login" className="text-sm text-slate-600 underline hover:text-slate-900">
                חזרה להתחברות
              </Link>
            </div>
          ) : (
            <form action={requestPasswordResetAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input id="email" name="email" type="email" dir="ltr" className="text-right" autoComplete="username" required />
              </div>
              {error ? <p className="text-sm text-red-600">לא ניתן לשלוח קישור איפוס כרגע. נסה שוב.</p> : null}
              <Button type="submit" className="w-full" size="lg">
                שליחת קישור איפוס
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-sm text-slate-600 underline hover:text-slate-900">
                  חזרה להתחברות
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
