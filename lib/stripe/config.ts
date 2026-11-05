import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2026-08-26.dahlia",
    })
  : null;

export function getStripe() {
  if (!stripe) {
    throw new Error("Falta STRIPE_SECRET_KEY en las variables de entorno.");
  }
  return stripe;
}

// Planes de pago. Los precios viven en Stripe y se localizan por lookup_key
// (los crea scripts/stripe-setup.mjs). Los límites viven en la tabla plans de Supabase.
export const PAID_PLAN_CODES = ["videos", "pro"] as const;
export type PaidPlanCode = (typeof PAID_PLAN_CODES)[number];

export function isPaidPlanCode(value: string): value is PaidPlanCode {
  return (PAID_PLAN_CODES as readonly string[]).includes(value);
}

export const PLAN_LOOKUP_KEYS: Record<PaidPlanCode, string> = {
  videos: "visitalo_videos_mensual",
  pro: "visitalo_pro_mensual",
};

let cachedVatRateId: string | null = null;
let cachedPortalConfigurationId: string | null = null;

export async function getVatRateId(): Promise<string> {
  if (cachedVatRateId) return cachedVatRateId;
  const client = getStripe();
  for await (const rate of client.taxRates.list({ active: true, limit: 100 })) {
    if (rate.metadata?.visitalo === "iva_es_21" && rate.percentage === 21 && !rate.inclusive) {
      cachedVatRateId = rate.id;
      return rate.id;
    }
  }
  throw new Error("No se encuentra el IVA del 21 % en Stripe. Ejecuta scripts/stripe-setup.mjs.");
}

export async function getPortalConfigurationId(): Promise<string> {
  if (cachedPortalConfigurationId) return cachedPortalConfigurationId;
  const client = getStripe();
  for await (const config of client.billingPortal.configurations.list({ limit: 100 })) {
    if (config.metadata?.visitalo === "portal" && config.active) {
      cachedPortalConfigurationId = config.id;
      return config.id;
    }
  }
  throw new Error("No se encuentra la configuración del portal de Stripe. Ejecuta scripts/stripe-setup.mjs.");
}
