"use server";

import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";
import { getStripe, plans } from "@/lib/stripe/config";

export async function createCheckoutSession(formData: FormData) {
  const planKey = String(formData.get("plan") ?? "");
  const plan = plans[planKey as keyof typeof plans];

  if (!plan) {
    redirect("/dashboard?error=Plan+no+válido");
  }

  const supabase = await createServerComponentClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: agencyMember } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!agencyMember?.agency_id) {
    redirect("/onboarding");
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("id, name")
    .eq("id", agencyMember.agency_id)
    .single();

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price_data: {
          currency: plan.currency,
          unit_amount: plan.amount,
          recurring: {
            interval: "month",
          },
          product_data: {
            name: `${plan.name} · ${agency?.name ?? "Visitalo.ai"}`,
            description: plan.description,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=cancelled`,
    customer_email: user.email,
    metadata: {
      agency_id: agencyMember.agency_id,
      plan_id: plan.id,
      user_id: user.id,
    },
  });

  redirect(session.url!);
}
