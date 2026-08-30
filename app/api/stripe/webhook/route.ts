import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/config";
import { createServerComponentClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe-signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return new NextResponse(`Webhook Error: ${(error as Error).message}`, { status: 400 });
  }

  const supabase = await createServerComponentClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const agencyId = session.metadata?.agency_id;
      const planKey = session.metadata?.plan_id;

      if (!agencyId || !planKey) {
        return new NextResponse("Missing agency or plan metadata", { status: 400 });
      }

      const { data: plan } = await supabase
        .from("plans")
        .select("id")
        .eq("code", planKey)
        .single();

      if (!plan) {
        return new NextResponse("Plan not found", { status: 404 });
      }

      const subscriptionStatus = session.subscription ? "active" : "incomplete";

      await supabase.from("subscriptions").upsert(
        {
          agency_id: agencyId,
          plan_id: plan.id,
          status: subscriptionStatus,
          stripe_customer_id: session.customer?.toString() ?? null,
          stripe_subscription_id: session.subscription?.toString() ?? null,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
        },
        { onConflict: "agency_id" }
      );
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription & {
        metadata?: { agency_id?: string };
        current_period_start?: number;
        current_period_end?: number;
      };
      const agencyId = subscription.metadata?.agency_id;

      if (!agencyId) {
        return new NextResponse("Missing agency metadata", { status: 400 });
      }

      await supabase.from("subscriptions").upsert(
        {
          agency_id: agencyId,
          status: subscription.status,
          stripe_customer_id: subscription.customer?.toString() ?? null,
          stripe_subscription_id: subscription.id,
          current_period_start: subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000).toISOString()
            : null,
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
        },
        { onConflict: "agency_id" }
      );
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription & {
        metadata?: { agency_id?: string };
      };
      const agencyId = subscription.metadata?.agency_id;

      if (!agencyId) {
        return new NextResponse("Missing agency metadata", { status: 400 });
      }

      await supabase.from("subscriptions").update({
        status: "canceled",
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      }).eq("agency_id", agencyId);
      break;
    }

    default:
      break;
  }

  return new NextResponse(null, { status: 200 });
}
