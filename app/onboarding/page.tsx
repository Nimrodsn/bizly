import { completeOnboardingAction } from "@/lib/actions/onboarding";
import { requireUser } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n/he";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (business) redirect("/dashboard");

  const defaultActivities = `${t("onboarding.defaultActivityMath")}\n${t("onboarding.defaultActivityFitness")}`;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">{t("onboarding.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("onboarding.taxNote")}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("onboarding.stepBusiness")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={completeOnboardingAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">{t("onboarding.stepBusiness")}</Label>
              <Input id="businessName" name="businessName" required placeholder="שם העסק" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activities">{t("onboarding.stepActivities")}</Label>
              <textarea
                id="activities"
                name="activities"
                defaultValue={defaultActivities}
                rows={4}
                className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <input type="hidden" name="tax_status" value="EXEMPT_DEALER" />
            <input type="hidden" name="income_tax_status" value="SMALL_BUSINESS_OWNER" />
            <input type="hidden" name="tax_year" value="2026" />
            <p className="text-xs text-slate-500">
              {t("onboarding.exemptDealer")} · {t("onboarding.smallBusiness")} · שנת מס 2026
            </p>
            <Button type="submit" className="w-full">
              {t("onboarding.finish")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
