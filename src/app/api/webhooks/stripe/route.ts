// src/app/api/webhooks/stripe/route.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const supabase = supabaseAdmin();

  await supabase.from("users").update({
    stripe_status: subscription.status,
    stripe_price_id: subscription.items.data[0]?.price.id,
    stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  }).eq("id", userId);
}
