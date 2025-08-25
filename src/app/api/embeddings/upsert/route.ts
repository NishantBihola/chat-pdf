// src/app/api/embeddings/upsert/route.ts
import { NextRequest, NextResponse } from "next/server";
import { embedTexts } from "@/lib/openai";
import { pinecone, PINECONE_INDEX } from "@/lib/pinecone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pinecone metadata should be small; keep a preview only
const META_TEXT_LIMIT = 8000; // characters (adjust as needed)

// Batch size for upsert calls (Pinecone is fine with 100–500 per call; keep modest)
const UPSERT_BATCH = 100;

type Chunk = { id: string; text: string };

function validateEnv() {
  const missing = [
    ["PINECONE_API_KEY", process.env.PINECONE_API_KEY],
    ["PINECONE_INDEX", PINECONE_INDEX],
    ["OPENAI_API_KEY", process.env.OPENAI_API_KEY],
  ].filter(([, v]) => !v);
  if (missing.length) {
    throw new Error(
      `Missing env vars: ${missing.map(([k]) => k).join(", ")}`
    );
  }
}

function toBatches<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function POST(req: NextRequest) {
  try {
    validateEnv();

    const body = await req.json();
    const docId = body?.docId as string | undefined;
    const chunks = body?.chunks as Chunk[] | undefined;

    if (!docId) {
      return NextResponse.json({ ok: false, error: "Missing docId" }, { status: 400 });
    }
    if (!Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json({ ok: false, error: "No chunks" }, { status: 400 });
    }

    // Get embeddings (OpenAI)
    const texts = chunks.map((c) => c.text ?? "");
    const vectors = await embedTexts(texts); // number[][], dimension must match index dim

    if (!Array.isArray(vectors) || vectors.length !== chunks.length) {
      throw new Error("Embeddings response length mismatch");
    }

    // Prepare Pinecone client & index
    const pc = pinecone();
    const index = pc.index(PINECONE_INDEX); // v3 style

    // Build vector payloads with safe metadata
    const items = vectors.map((values, i) => {
      const id = chunks[i].id || `${docId}-${i}`;
      const text = (chunks[i].text || "").slice(0, META_TEXT_LIMIT);

      return {
        id,
        values,
        metadata: {
          docId,
          // Store only a preview to keep metadata small; full text should live in your DB/storage
          text,
        } as Record<string, string>,
      };
    });

    // Upsert in batches
    const batches = toBatches(items, UPSERT_BATCH);
    let upserted = 0;

    for (const batch of batches) {
      const res = await index.upsert(batch);
      // Pinecone v3 returns { upsertedCount?: number } — handle both cases defensively
      upserted += (res as any)?.upsertedCount ?? batch.length;
    }

    return NextResponse.json({ ok: true, upserted, namespace: docId });
  } catch (err: any) {
    const message = err?.message || "Unexpected error";
    // Surface partial error details for easier debugging
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
