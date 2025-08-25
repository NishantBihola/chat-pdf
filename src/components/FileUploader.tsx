"use client";
import { useTransition } from "react";
import { askQuestion } from "@/actions/askQuestion"; // this is OK (server action)

export default function FileUploader() {
  const [pending, start] = useTransition();

  // ... upload code ...

  function onAsk(docId: string, q: string) {
    start(async () => {
      const res = await askQuestion({ documentId: docId, question: q });
      // handle res.answer
    });
  }

  return (/* your UI */);
}
