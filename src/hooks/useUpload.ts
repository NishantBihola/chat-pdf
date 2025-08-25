"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@clerk/nextjs";

type UploadResult = { documentId: string };

export default function useUpload() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File): Promise<UploadResult> {
    if (!user) throw new Error("Sign in required");
    setLoading(true);
    setError(null);
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;

      // 1) Upload to Supabase Storage (bucket "documents")
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

      // 3) Kick off server ingest (chunks+embeddings)
      await fetch("/api/ingest-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: row.id, storagePath: path }),
      });

      return { documentId: row.id as string };
    } catch (e: any) {
      setError(e.message ?? "Upload failed");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { upload, loading, error };
}
