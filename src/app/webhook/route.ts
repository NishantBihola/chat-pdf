// app/webhook/route.ts
export const runtime = "nodejs";

import { headers } from "next/headers";
import { Webhook } from "svix";
import { createClient } from "@supabase/supabase-js";

const admin = new createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const payload = await req.text();
  const h = headers();
  const svix_id = h.get("svix-id");
  const svix_timestamp = h.get("svix-timestamp");
  const svix_signature = h.get("svix-signature");
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing Svix headers", { status: 400 });
  }

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let evt: any;
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (e) {
    console.error("Invalid signature", e);
    return new Response("Invalid signature", { status: 400 });
  }

  // Handle events you subscribed to
  if (evt.type === "user.created" || evt.type === "user.updated") {
    const d = evt.data;
    await admin.from("users").upsert({
      id: d.id,
      email: d.email_addresses?.[0]?.email_address ?? null,
      first_name: d.first_name ?? null,
      last_name: d.last_name ?? null,
      image_url: d.image_url ?? null,
      updated_at: new Date().toISOString(),
    });
  }

  if (evt.type === "user.deleted") {
    await admin.from("users").delete().eq("id", evt.data.id);
  }

  return new Response("ok", { status: 200 });
}
