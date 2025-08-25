// src/app/webhook/route.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const supabase = supabaseAdmin();

  // Instead of Firestore set/merge:
  await supabase.from("users").upsert({
    id: clerkUser.id,
    email: clerkUser.email_addresses[0].email_address,
    first_name: clerkUser.first_name,
    last_name: clerkUser.last_name,
    image_url: clerkUser.image_url,
  });
}
