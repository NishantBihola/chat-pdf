import { NextRequest, NextResponse } from "next/server";
import { embedTexts, chatAnswer } from "@/lib/openai";
import { pinecone, PINECONE_INDEX, PINECONE_HOST } from "@/lib/pinecone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { question, topK = 5 } = await req.json();
  const [qVec] = await embedTexts([question]);

  const pc = pinecone();
  const index = pc.Index(PINECONE_INDEX, PINECONE_HOST);
  const results = await index.query({ vector: qVec, topK, includeMetadata: true });

  const contexts = (results.matches || [])
    .map(m => (m.metadata as any)?.text)
    .filter(Boolean)
    .slice(0, topK)
    .join("\n---\n");

  const prompt = `You are a helpful assistant. Use ONLY the context to answer.\n\nContext:\n${contexts}\n\nQuestion: ${question}`;
  const answer = await chatAnswer(prompt);

  return NextResponse.json({ ok:true, answer, matches: results.matches });
}
