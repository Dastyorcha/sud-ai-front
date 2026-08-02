import { useState } from "react";
import { askAdvisor, createAdvisorMessage } from "@/shared/lib/mock-api/case-advisor.service";
import type { CaseAdvisorMessage } from "@/shared/types/case-advisor";

export interface UseCaseAdvisorChatResult {
  messages: CaseAdvisorMessage[];
  isSending: boolean;
  sendMessage: (text: string) => Promise<void>;
}

/** Per-case "Sudya maslahatchisi" chat state — one thread per mounted tab, not persisted. */
export function useCaseAdvisorChat(caseId: string): UseCaseAdvisorChatResult {
  const [messages, setMessages] = useState<CaseAdvisorMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  async function sendMessage(text: string) {
    const question = text.trim();
    if (!question || isSending) return;

    const userMessage = createAdvisorMessage("user", question, Date.now());
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);
    try {
      const reply = await askAdvisor({ caseId, question });
      setMessages((prev) => [...prev, createAdvisorMessage("assistant", reply, Date.now())]);
    } finally {
      setIsSending(false);
    }
  }

  return { messages, isSending, sendMessage };
}
