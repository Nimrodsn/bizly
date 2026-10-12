import { ChatPanel } from "@/components/ai/chat-panel";
import { PageHeader } from "@/components/shell/page-header";
import { t } from "@/lib/i18n/he";

export default function AiPage() {
  return (
    <div>
      <PageHeader title={t("nav.ai")} description="תשובות מבוססות על הנתונים שלך בלבד" />
      <ChatPanel />
    </div>
  );
}
