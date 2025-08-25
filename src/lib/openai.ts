// src/lib/openai.ts
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/** Embed a single string */
export async function embedText(text: string) {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

/** Embed many strings */
export async function embedMany(texts: string[]) {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return res.data.map(e => e.embedding);
}

/** Simple chat helper */
export async function chatAnswer(system: string, user: string) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.1,
  });
  return res.choices[0]?.message?.content ?? "";
}
