"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type Message = { role: "user" | "assistant"; content: string; source?: string };

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content }),
      });
      const json = (await res.json()) as { answer?: string; source?: string; error?: string };
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: json.answer ?? json.error ?? "לא ניתן לענות כרגע.",
          source: json.source,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col gap-4">
      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map((m, i) => (
          <Card key={i} className={m.role === "user" ? "ms-8" : "me-8"}>
            <CardContent className="py-3 text-sm">
              <p>{m.content}</p>
              {m.source ? <p className="mt-2 text-xs text-slate-500">{m.source}</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="שאל על ההכנסות, ההוצאות או המחזור..."
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <Button onClick={send} disabled={loading}>
          שלח
        </Button>
      </div>
    </div>
  );
}
