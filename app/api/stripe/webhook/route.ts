import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const KNOWN_STATUSES = new Set([
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "paused",
]);

const FINAL_STATUSES = new Set(["canceled", "incomplete_expired"]);

type WithPeriod = { current_period_start?: number | null; current_period_end?: number | null };

function toIso(seconds?: number | null) {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

function getPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items?.data?.[0] as unknown as WithPeriod | undefined;
  const legacy = subscription as unknown as WithPeriod;
  return {
    start: toIso(item?.current_period_start ?? legacy.current_period_start),
    end: toIso(item?.current_period_end ?? legacy.current_period_end),
  };
}

function idOf(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const supabase = createAdminClient();
  const customerId = idOf(subscription.customer as string | { id: string });

  let agencyId = subscription.metadata?.agency_id ?? null;

  const { data: bySubscription } = await supabase
    .from("subscriptions")
    .select("agency_id, stripe_subscription_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (!agencyId) agencyId = bySubscription?.agency_id ?? null;

  if (!agencyId && customerId) {
    const { data: byCustomer } = await supabase
      .from("subscriptions")
      .select("agency_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    agencyId = byCustomer?.agency_id ?? null;
  }

  if (!agencyId) {
    throw new Error(`La suscripción ${subscription.id} no tiene agency_id.`);
  }

  const { data: current } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id, status")
    .eq("agency_id", agencyId)
    .maybeSingle();

  // Evita que el aviso tardío de una suscripción antigua cancelada pise una nueva.
  if (
    current?.stripe_subscription_id &&
    current.stripe_subscription_id !== subscription.id &&
    FINAL_STATUSES.has(subscription.status)
  ) {
    return;
  }

  const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
  let planId: string | null = null;

  if (priceId) {
    const { data: planByPrice } = await supabase
      .from("plans")
      .select("id")
      .eq("stripe_price_id", priceId)
      .maybeSingle();
    planId = planByPrice?.id ?? null;
  }

  if (!planId && subscription.metadata?.plan_code) {
    const { data: planByCode } = await supabase
      .from("plans")
      .select("id")
      .eq("code", subscription.metadata.plan_code)
      .maybeSingle();
    planId = planByCode?.id ?? null;
  }

  if (!planId) {
    throw new Error(`No se encuentra el plan del precio ${priceId ?? "desconocido"}.`);
  }

  const { start, end } = getPeriod(subscription);
  const status = KNOWN_STATUSES.has(subscription.status) ? subscription.status : "incomplete";

  const { error } = await supabase.from("subscriptions").upsert(
    {
      agency_id: agencyId,
      plan_id: planId,
      status,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      current_period_start: start,
      current_period_end: end,
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end || subscription.cancel_at),
    },
    { onConflict: "agency_id" }
  );

  if (error) {
    throw new Error(`Error guardando la suscripción: ${error.message}`);
  }
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice) {
  const shape = invoice as unknown as {
    subscription?: string | { id: string } | null;
    parent?: { subscription_details?: { subscription?: string | { id: string } | null } | null } | null;
  };
  return idOf(shape.parent?.subscription_details?.subscription ?? shape.subscription ?? null);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new NextResponse("Falta STRIPE_WEBHOOK_SECRET", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new NextResponse("Falta la firma de Stripe", { status: 400 });
  }

  const stripe = getStripe();
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return new NextResponse(`Firma no válida: ${(error as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = idOf(session.subscription as string | { id: string } | null);
        if (session.mode === "subscription" && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }

      case "invoice.paid":
      case "invoice.payment_failed": {
        const subscriptionId = subscriptionIdFromInvoice(event.data.object as Stripe.Invoice);
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(subscription);
        }
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error(`[stripe-webhook] ${event.type}:`, error);
    return new NextResponse("Error procesando el evento", { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
