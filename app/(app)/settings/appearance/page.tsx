"use client";

import { useTheme } from "next-themes";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";

export default function AppearanceSettingsPage() {
  const { setTheme } = useTheme();
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="מראה" />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setTheme("light")}>
          בהיר
        </Button>
        <Button variant="outline" onClick={() => setTheme("dark")}>
          כהה
        </Button>
        <Button variant="outline" onClick={() => setTheme("system")}>
          מערכת
        </Button>
      </div>
    </div>
  );
}
