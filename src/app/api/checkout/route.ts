import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@clerk/nextjs/server";  // to get the user ID/email

export async function POST() {
  const { userId } = auth();
  // In practice, fetch the Clerk user's email via Clerk API if needed
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: "Pro Plan" },
        recurring: { interval: "month" },
        unit_amount: 1500
      },
      quantity: 1
    }],
    success_url: `${origin}/dashboard?status=success`,
    cancel_url: `${origin}/dashboard/upgrade?status=cancelled`,
    metadata: { clerk_user_id: userId ?? "" }
  });

  return NextResponse.json({ url: session.url });
}
