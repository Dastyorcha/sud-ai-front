import { useState, type KeyboardEvent } from "react";
import { Send, Bot, User as UserIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import NoData from "@/shared/components/ui/noData";
import { useCaseAdvisorChat } from "@/features/case-advisor/use-case-advisor-chat";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { cn } from "@/shared/lib/utils";

export interface CaseAdvisorChatProps {
  caseId: string;
}

/** "Sudya maslahatchisi" tab content — a per-case AI assistant chat (mock backend for now). */
export default function CaseAdvisorChat({ caseId }: CaseAdvisorChatProps) {
  const { t } = useTranslation();
  const { messages, isSending, sendMessage } = useCaseAdvisorChat(caseId);
  const [draft, setDraft] = useState("");

  async function handleSend() {
    if (!draft.trim() || isSending) return;
    const text = draft;
    setDraft("");
    await sendMessage(text);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="flex h-[28rem] flex-col rounded-lg border border-border bg-card">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <NoData
            title={t("caseAdvisorChat.emptyTitle")}
            description={t("caseAdvisorChat.emptyDescription")}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-2",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                  aria-hidden="true"
                >
                  {message.role === "user" ? (
                    <UserIcon className="size-4" />
                  ) : (
                    <Bot className="size-4" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[75%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex items-center gap-2 pl-10 text-xs text-muted-foreground">
                {t("caseAdvisorChat.typing")}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 border-t border-border p-3">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("caseAdvisorChat.placeholder")}
          rows={2}
          className="resize-none"
        />
        <Button
          type="button"
          variant="gold"
          size="icon"
          disabled={!draft.trim() || isSending}
          onClick={() => void handleSend()}
          aria-label={t("caseAdvisorChat.send")}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
