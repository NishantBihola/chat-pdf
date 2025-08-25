// src/app/api/webhooks/stripe/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";          // ensure Node runtime (not Edge)
export const dynamic = "force-dynamic";   // optional: don't cache webhook route

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  // 1) Get raw body & signature (NO body parsing)
  const body = await req.text();
  const signature = headers().get("stripe-signature");
  if (!signature) {
    return new NextResponse("Missing stripe-signature", { status: 400 });
  }

  // 2) Verify event
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 3) Use service-role Supabase client for writes
  const supabase = new createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 4) Handle events you care about
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId; // set this when creating Checkout
      if (userId) {
        await supabase
          .from("users")
          .update({
            stripe_status: sub.status,
            stripe_price_id:
              typeof sub.items?.data?.[0]?.price?.id === "string"
                ? sub.items.data[0].price.id
                : null,
            stripe_current_period_end: new Date(
              sub.current_period_end * 1000
            ).toISOString(),
          })
          .eq("id", userId);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) {
        await supabase
          .from("users")
          .update({
            stripe_status: "canceled",
          })
          .eq("id", userId);
      }
      break;
    }
    // add other events as needed
    default:
      break;
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
