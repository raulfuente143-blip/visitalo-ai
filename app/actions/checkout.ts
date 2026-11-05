"use server";

import type Stripe from "stripe";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";
import {
  getPortalConfigurationId,
  getStripe,
  getVatRateId,
  isPaidPlanCode,
  PLAN_LOOKUP_KEYS,
} from "@/lib/stripe/config";

const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

function billingError(message: string): never {
  redirect(`/billing?error=${encodeURIComponent(message)}`);
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function createCheckoutSession(formData: FormData) {
  const planCode = String(formData.get("plan") ?? "");
  if (!isPaidPlanCode(planCode)) {
    billingError("Plan no válido.");
  }

  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.agency_id) {
    redirect(`/settings?error=${encodeURIComponent("Completa el perfil de tu agencia antes de elegir un plan.")}`);
  }

  const agencyId = membership.agency_id as string;

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("status, stripe_customer_id")
    .eq("agency_id", agencyId)
    .maybeSingle();

  if (existing && ACTIVE_STATUSES.includes(existing.status)) {
    billingError("Ya tienes una suscripción activa. Puedes gestionarla desde «Gestionar suscripción».");
  }

  const stripe = getStripe();
  const { data: prices } = await stripe.prices.list({
    lookup_keys: [PLAN_LOOKUP_KEYS[planCode]],
    active: true,
    limit: 1,
  });
  const price = prices[0];
  if (!price) {
    billingError("Este plan no está disponible ahora mismo. Inténtalo más tarde.");
  }

  const vatRateId = await getVatRateId();

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    locale: "es",
    line_items: [{ price: price.id, quantity: 1, tax_rates: [vatRateId] }],
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    client_reference_id: agencyId,
    metadata: { agency_id: agencyId, plan_code: planCode },
    subscription_data: {
      metadata: { agency_id: agencyId, plan_code: planCode },
    },
    success_url: `${appUrl()}/billing?checkout=success`,
    cancel_url: `${appUrl()}/billing?checkout=cancelled`,
  };

  if (existing?.stripe_customer_id) {
    params.customer = existing.stripe_customer_id;
    params.customer_update = { address: "auto", name: "auto" };
  } else if (user.email) {
    params.customer_email = user.email;
  }

  const session = await stripe.checkout.sessions.create(params);

  if (!session.url) {
    billingError("No se ha podido iniciar el pago. Inténtalo de nuevo.");
  }

  redirect(session.url);
}

export async function createPortalSession() {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.agency_id) {
    redirect("/settings");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("agency_id", membership.agency_id)
    .maybeSingle();

  if (!subscription?.stripe_customer_id) {
    billingError("Todavía no tienes ninguna suscripción que gestionar.");
  }

  const stripe = getStripe();
  const configuration = await getPortalConfigurationId();
  const portal = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    configuration,
    locale: "es",
    return_url: `${appUrl()}/billing`,
  });

  redirect(portal.url);
}
