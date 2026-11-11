import { updatePasswordAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">בחירת סיסמה חדשה</CardTitle>
          <CardDescription>הזן סיסמה חדשה לחשבון שלך</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updatePasswordAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה חדשה</Label>
              <Input id="password" name="password" type="password" dir="ltr" className="text-right" autoComplete="new-password" minLength={6} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">אימות סיסמה</Label>
              <Input id="confirm" name="confirm" type="password" dir="ltr" className="text-right" autoComplete="new-password" minLength={6} required />
            </div>
            {error ? (
              <p className="text-sm text-red-600">
                הסיסמאות לא תואמות, קצרות מדי (לפחות 6 תווים), או שהקישור פג תוקף. אם הקישור פג, בקש קישור חדש ממסך ההתחברות.
              </p>
            ) : null}
            <Button type="submit" className="w-full" size="lg">
              עדכון סיסמה
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
