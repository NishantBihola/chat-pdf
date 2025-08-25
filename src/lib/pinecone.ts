import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

export function getIndex() {
  const index = process.env.PINECONE_INDEX!;
  const host = process.env.PINECONE_HOST; // optional (v2 serverless)
  return host ? pc.Index(index, host) : pc.Index(index);
}
