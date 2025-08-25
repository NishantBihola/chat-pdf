import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
const pdfParse = require("pdf-parse");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) return NextResponse.json({ ok:false, error:"Missing file" }, { status:400 });
    if (file.size > MAX) return NextResponse.json({ ok:false, error:"File too large" }, { status:413 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const path = `uploads/${Date.now()}-${file.name}`;
    const supa = supabaseServer();
    const { error } = await supa.storage.from(process.env.SUPABASE_BUCKET!).upload(path, bytes, {
      contentType: file.type, upsert: false
    });
    if (error) throw error;

    // Optional: quick PDF preview (first 4000 chars)
    let preview = "";
    if (file.type === "application/pdf") {
      try { preview = ((await pdfParse(bytes))?.text ?? "").slice(0, 4000); } catch {}
    }
    return NextResponse.json({ ok:true, path, preview });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || "Unexpected error"}, { status:500 });
  }
}
