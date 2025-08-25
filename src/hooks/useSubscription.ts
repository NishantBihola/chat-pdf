"use client";

import useSWR from "swr";

export type SubscriptionInfo = {
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete" | null;
  priceId?: string | null;
  currentPeriodEnd?: string | null; // ISO string
};

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error("Failed to load subscription");
  return r.json();
});

export default function useSubscription() {
  const { data, error, isLoading, mutate } = useSWR<SubscriptionInfo>(
    "/api/subscription",
    fetcher,
    { revalidateOnFocus: false }
  );

  const isPro =
    data?.status === "active" || data?.status === "trialing";

  return {
    subscription: data,
    loading: isLoading,
    error,
    isPro,
    refresh: mutate,
  };
}
