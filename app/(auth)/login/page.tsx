import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bizly</CardTitle>
          <CardDescription>קבלות וניהול לעוסק פטור</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" name="email" type="email" dir="ltr" className="text-right" autoComplete="username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input id="password" name="password" type="password" dir="ltr" className="text-right" autoComplete="current-password" required />
            </div>
            {error === "auth" ? (
              <p className="text-sm text-red-600">הקישור לאיפוס הסיסמה פג תוקף או לא תקין. בקש קישור חדש.</p>
            ) : error ? (
              <p className="text-sm text-red-600">אימייל או סיסמה שגויים.</p>
            ) : null}
            <Button type="submit" className="w-full" size="lg">
              כניסה
            </Button>
            <div className="text-center">
              <Link href="/forgot-password" className="text-sm text-slate-600 underline hover:text-slate-900">
                שכחתי סיסמה
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
