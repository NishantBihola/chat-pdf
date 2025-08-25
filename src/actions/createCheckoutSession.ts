"use server";

import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function createCheckoutSession() {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    billing_address_collection: "auto",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!, // your subscription price ID
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?status=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?status=cancelled`,
    metadata: { userId },
  });

  redirect(session.url!);
}
