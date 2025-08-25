"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@clerk/nextjs";
import useUpload from "@/hooks/useUpload"; // if you created the hook earlier (optional)

export default function FileUploader() {
  const { user } = useUser();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!user) return alert("Please sign in.");
    setIsUploading(true);
    setErr(null);
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;

      // 1) Upload to Supabase Storage (bucket: documents)
      const { error: upErr } = await supabase
        .storage
        .from("documents")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;

      // 2) Insert DB row
      const { data: row, error: dbErr } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          title: file.name,
          storage_path: path,
          status: "uploaded",
        })
        .select()
        .single();
      if (dbErr) throw dbErr;

      // 3) Kick off ingest
      await fetch("/api/ingest-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: row.id, storagePath: path }),
      });

      router.push(`/dashboard/documents/${row.id}`);
    } catch (e: any) {
      console.error(e);
      setErr(e.message ?? "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="flex h-48 w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed">
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {isUploading ? "Uploading…" : "Click to select a PDF"}
      </label>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}
