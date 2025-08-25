// src/app/api/ingest-upload/route.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const { documentId, storagePath } = await req.json();
  const supabase = supabaseAdmin();

  const { data: file } = await supabase.storage.from("documents").download(storagePath);
  const buffer = Buffer.from(await file!.arrayBuffer());

  // …chunk, embed, index…
}
