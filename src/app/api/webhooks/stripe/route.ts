import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const buf = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const supabase = new createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Example: checkout.session.completed → set stripe_status active/trialing
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata.userId; // set this when you create the checkout session
    await supabase.from("users").update({
      stripe_status: sub.status,
      stripe_price_id: typeof sub.items?.data?.[0]?.price?.id === "string" ? sub.items.data[0].price.id : null,
      stripe_current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    }).eq("id", userId);
  }

  return NextResponse.json({ received: true });
}

export const config = {
  api: { bodyParser: false }, // if you were in pages router; App Router reads raw body by default
};
