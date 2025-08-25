// src/lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  return new createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
