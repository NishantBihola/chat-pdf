"use server";

import { z } from "zod";
import { retrieveContext, answerWithContext } from "@/lib/rag";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const schema = z.object({
  documentId: z.string().min(1),
  question: z.string().min(1),
});

export async function askQuestion(input: unknown) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { documentId, question } = schema.parse(input);

  // 1) Retrieve top-k chunks from Pinecone
  const { context, matches } = await retrieveContext({ documentId, query: question });

  // 2) Generate answer with OpenAI
  const answer = await answerWithContext({ question, context });

  // 3) Store Q/A into Supabase (optional but nice to have)
  const supabase = new createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("messages").insert({
    user_id: userId,
    document_id: documentId,
    question,
    answer,
    sources: matches?.map((m) => m.id) ?? [],
  });

  return { answer, sources: matches ?? [] };
}
