import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { extension as extFromMime, lookup as mimeFromPath } from "mime-types";
import * as crypto from "crypto";
const pdfParse = require("pdf-parse");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB
const FETCH_TIMEOUT_MS = 25_000;
const ALLOWED_MIME_PREFIXES = ["application/pdf", "text/", "image/"]; // tweak as you like

function isAllowedType(type: string) {
  return ALLOWED_MIME_PREFIXES.some((p) =>
    p.endsWith("/") ? type.startsWith(p) : type === p
  );
}

function sanitizeFilename(name: string) {
  // Remove path parts and unsafe chars
  const base = name.split(/[\\/]/).pop() || "file";
  return base.replace(/[^\w\-.,@()%&[\]{}+=\s]/g, "_").slice(0, 160);
}

function getFilenameFromContentDisposition(cd?: string | null): string | null {
  if (!cd) return null;
  // Simple parse for filename="..."
  const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
  return match ? sanitizeFilename(decodeURIComponent(match[1])) : null;
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number }
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), init?.timeoutMs ?? FETCH_TIMEOUT_MS);
  try {
    // @ts-ignore
    return await fetch(input, { ...init, signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(id);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ ok: false, error: "Missing or invalid url" }, { status: 400 });
    }

    let target: URL;
    try {
      target = new URL(url);
      if (!/^https?:$/i.test(target.protocol)) {
        return NextResponse.json({ ok: false, error: "Only http/https URLs are allowed" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid URL" }, { status: 400 });
    }

    // 1) HEAD preflight to check size/type quickly (best-effort)
    try {
      const head = await fetchWithTimeout(target, { method: "HEAD" });
      if (head.ok) {
        const len = head.headers.get("content-length");
        if (len && Number(len) > MAX_BYTES) {
          return NextResponse.json({ ok: false, error: `File exceeds ${MAX_BYTES} bytes` }, { status: 413 });
        }
      }
    } catch {
      // ignore HEAD errors; we’ll still try GET
    }

    // 2) GET body
    const res = await fetchWithTimeout(target, { timeoutMs: FETCH_TIMEOUT_MS });
    if (!res.ok || !res.body) {
      return NextResponse.json({ ok: false, error: `Fetch failed ${res.status}` }, { status: 400 });
    }

    // Determine content type
    let type = res.headers.get("content-type") || "";
    if (type.includes(";")) type = type.split(";")[0].trim();
    if (!type) type = "application/octet-stream";

    // Optional: restrict types
    // if (!isAllowedType(type)) {
    //   return NextResponse.json({ ok: false, error: `Unsupported content-type: ${type}` }, { status: 415 });
    // }

    // Stream -> buffer with size guard
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        received += value.byteLength;
        if (received > MAX_BYTES) {
          // Abort reading early
          try { reader.cancel(); } catch {}
          return NextResponse.json({ ok: false, error: `File exceeds ${MAX_BYTES} bytes` }, { status: 413 });
        }
        chunks.push(value);
      }
    }

    const buff = Buffer.concat(chunks);

    // Filename strategy:
    //   1) Content-Disposition header
    //   2) URL path last segment
    //   3) Hash + extension from MIME or path
    const cd = res.headers.get("content-disposition");
    let filename =
      getFilenameFromContentDisposition(cd) ||
      sanitizeFilename(target.pathname.split("/").pop() || "file");

    // Ensure an extension if missing
    const extFromHeader = extFromMime(type) || "";
    const hasExt = /\.[A-Za-z0-9]+$/.test(filename);
    if (!hasExt) {
      // Try infer from path, then fallback to mime
      const inferredFromPath = mimeFromPath(filename);
      if (!inferredFromPath && extFromHeader) {
        filename = `${filename}.${extFromHeader}`;
      }
    }

    // If still generic, prefix with hash to avoid collisions
    const sha = crypto.createHash("sha1").update(buff).digest("hex").slice(0, 8);
    filename = filename.replace(/^file(\.[^.]+)?$/, `file-${sha}$1`);

    const path = `uploads/${Date.now()}-${filename}`;

    // Upload to Supabase Storage (server-side with service role)
    const supa = supabaseServer();
    const { error } = await supa.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(path, buff, {
        contentType: type,
        upsert: false,
        cacheControl: "3600",
      });
    if (error) {
      return NextResponse.json({ ok: false, error: `Storage upload failed: ${error.message}` }, { status: 500 });
    }

    // Optional: create a short text preview for PDFs
    let preview = "";
    if (type === "application/pdf") {
      try {
        const parsed = await pdfParse(buff);
        preview = (parsed?.text ?? "").slice(0, 4000);
      } catch {
        // ignore parse errors; preview remains empty
      }
    }

    return NextResponse.json({
      ok: true,
      path,
      filename,
      contentType: type,
      bytes: buff.byteLength,
      preview,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
