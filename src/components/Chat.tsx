"use client";

import { useState, useTransition } from "react";
import { askQuestion } from "@/actions/askQuestion";

export default function Chat({ docId }: { docId: string }) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string>("");
  const [pending, start] = useTransition();

  const onAsk = () => {
    if (!q.trim()) return;
    start(async () => {
      const res = await askQuestion({ documentId: docId, question: q });
      setAnswer(res?.answer ?? "");
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          placeholder="Ask something about this PDF…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAsk()}
        />
        <button
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          onClick={onAsk}
          disabled={pending}
        >
          {pending ? "Thinking…" : "Ask"}
        </button>
      </div>
      {answer && (
        <div className="rounded border bg-white p-3">
          <div className="text-xs text-gray-500 mb-1">Answer</div>
          <div>{answer}</div>
        </div>
      )}
    </div>
  );
}
