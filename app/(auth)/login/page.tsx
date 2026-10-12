import { loginWithGoogleAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/lib/i18n/he";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("auth.loginTitle")}</CardTitle>
          <CardDescription>{t("auth.loginSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginWithGoogleAction}>
            <Button type="submit" className="w-full" size="lg">
              {t("auth.loginButton")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
