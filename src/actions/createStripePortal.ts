"use server";

import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function createStripePortal() {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const portal = await stripe.billingPortal.sessions.create({
    customer: userId, // map Clerk userId <-> Stripe customer id in DB ideally
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
  });

  redirect(portal.url);
}
