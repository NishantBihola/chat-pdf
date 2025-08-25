import OpenAI from "openai";
import { getIndex } from "./pinecone";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type Match = {
  id: string;
  score: number;
  metadata?: Record<string, any>;
};

export async function retrieveContext(opts: {
  documentId: string;
  query: string;
  topK?: number;
}) {
  const { documentId, query, topK = 6 } = opts;

  // 1) Embed the query
  const emb = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  const vector = emb.data[0].embedding;

  // 2) Query Pinecone
  const index = getIndex();
  const res = await index.query({
    topK,
    vector,
    includeMetadata: true,
    filter: { documentId }, // ensure you only fetch chunks for this doc
  });

  // 3) Build context from matches
  const chunks =
    (res.matches as Match[] | undefined)?.map((m) => m.metadata?.text || "") ??
    [];
  const context = chunks.join("\n---\n").slice(0, 12000); // keep prompt small

  return { context, matches: res.matches ?? [] };
}

export async function answerWithContext(opts: {
  question: string;
  context: string;
}) {
  const { question, context } = opts;

  const system =
    "You are a helpful assistant that answers questions using ONLY the provided context. If the answer is not in the context, say you don’t know.";
  const user = `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer using only the context above.`;

  const chat = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.1,
  });

  return chat.choices[0]?.message?.content ?? "";
}
