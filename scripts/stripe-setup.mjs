// Configura Stripe para Visitalo.ai de forma idempotente (se puede ejecutar varias veces).
// Uso: node --env-file=.env.local scripts/stripe-setup.mjs
// En modo real (sk_live_) exige añadir --live de forma explícita.
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const secretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!secretKey || !supabaseUrl || !serviceRoleKey) {
  console.error("Faltan variables: STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const isLive = secretKey.startsWith("sk_live_");
if (isLive && !process.argv.includes("--live")) {
  console.error("Clave de Stripe en MODO REAL detectada. Si de verdad quieres configurar el modo real, repite con --live.");
  process.exit(1);
}

const stripe = new Stripe(secretKey);
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

const PLANS = [
  {
    code: "videos",
    name: "Visitalo.ai · Vídeos",
    description: "8 vídeos al mes · hasta 8 habitaciones · 2 usuarios",
    amount: 4000,
    lookupKey: "visitalo_videos_mensual",
  },
  {
    code: "pro",
    name: "Visitalo.ai · Pro",
    description: "20 vídeos al mes · hasta 10 habitaciones · 5 usuarios",
    amount: 10000,
    lookupKey: "visitalo_pro_mensual",
  },
];

async function listAll(listFn, params = {}) {
  const items = [];
  for await (const item of listFn(params)) items.push(item);
  return items;
}

async function ensureProduct(plan) {
  const products = await listAll((p) => stripe.products.list(p), { limit: 100 });
  const existing = products.find((p) => p.metadata?.visitalo_plan === plan.code);
  if (existing) {
    return stripe.products.update(existing.id, {
      name: plan.name,
      description: plan.description,
      active: true,
    });
  }
  return stripe.products.create({
    name: plan.name,
    description: plan.description,
    metadata: { visitalo_plan: plan.code },
  });
}

async function ensurePrice(plan, productId) {
  const { data } = await stripe.prices.list({ lookup_keys: [plan.lookupKey], active: true, limit: 1 });
  const current = data[0];
  const isValid =
    current &&
    current.product === productId &&
    current.unit_amount === plan.amount &&
    current.currency === "eur" &&
    current.recurring?.interval === "month" &&
    current.tax_behavior === "exclusive";

  if (isValid) return current;

  const created = await stripe.prices.create({
    product: productId,
    currency: "eur",
    unit_amount: plan.amount,
    recurring: { interval: "month" },
    tax_behavior: "exclusive",
    lookup_key: plan.lookupKey,
    transfer_lookup_key: true,
    metadata: { visitalo_plan: plan.code },
  });

  if (current && current.id !== created.id) {
    await stripe.prices.update(current.id, { active: false });
  }
  return created;
}

async function ensureTaxRate() {
  const rates = await listAll((p) => stripe.taxRates.list(p), { active: true, limit: 100 });
  const existing = rates.find(
    (r) => r.metadata?.visitalo === "iva_es_21" && r.percentage === 21 && r.inclusive === false
  );
  if (existing) return existing;
  return stripe.taxRates.create({
    display_name: "IVA",
    description: "IVA España 21 %",
    percentage: 21,
    inclusive: false,
    country: "ES",
    jurisdiction: "ES",
    tax_type: "vat",
    metadata: { visitalo: "iva_es_21" },
  });
}

async function ensurePortalConfiguration() {
  const configs = await listAll((p) => stripe.billingPortal.configurations.list(p), { limit: 100 });
  const existing = configs.find((c) => c.metadata?.visitalo === "portal" && c.active);
  const features = {
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    customer_update: { enabled: true, allowed_updates: ["name", "email", "address", "tax_id"] },
    subscription_cancel: {
      enabled: true,
      mode: "at_period_end",
      cancellation_reason: {
        enabled: true,
        options: ["too_expensive", "unused", "missing_features", "switched_service", "other"],
      },
    },
  };
  if (existing) {
    return stripe.billingPortal.configurations.update(existing.id, { features });
  }
  return stripe.billingPortal.configurations.create({
    features,
    metadata: { visitalo: "portal" },
  });
}

async function main() {
  console.log(`Modo de Stripe: ${isLive ? "REAL" : "TEST"}`);

  const { data: existingPlans, error: precheckError } = await supabase
    .from("plans")
    .select("code, max_rooms, is_trial")
    .in("code", PLANS.map((p) => p.code))
    .eq("is_active", true);

  if (precheckError || (existingPlans?.length ?? 0) !== PLANS.length) {
    console.error(
      `La tabla plans no tiene los planes activos esperados (${PLANS.map((p) => p.code).join(", ")}). No se ha tocado Stripe.`
    );
    if (precheckError) console.error(precheckError.message);
    process.exit(1);
  }

  const taxRate = await ensureTaxRate();
  console.log(`IVA: ${taxRate.percentage} % (${taxRate.inclusive ? "incluido" : "aparte"}) · ${taxRate.id}`);

  const portal = await ensurePortalConfiguration();
  console.log(`Portal de cliente: ${portal.id}`);

  for (const plan of PLANS) {
    const product = await ensureProduct(plan);
    const price = await ensurePrice(plan, product.id);
    const { data: updated, error } = await supabase
      .from("plans")
      .update({ stripe_price_id: price.id })
      .eq("code", plan.code)
      .select("code");
    if (error || !updated || updated.length !== 1) {
      console.error(
        `Error guardando el precio de ${plan.code} en Supabase: ${error?.message ?? `filas actualizadas: ${updated?.length ?? 0}`}`
      );
      process.exit(1);
    }
    console.log(
      `Plan ${plan.code}: producto ${product.id} · precio ${price.id} · ${(price.unit_amount / 100).toFixed(2)} €/mes sin IVA · lookup ${price.lookup_key}`
    );
  }

  const { data: plans, error: plansError } = await supabase
    .from("plans")
    .select("code, name, monthly_price_cents, video_limit, max_rooms, max_users, is_trial, is_active, sort_order, stripe_price_id")
    .order("is_active", { ascending: false })
    .order("sort_order", { ascending: true });

  if (plansError) {
    console.error(`Error leyendo planes: ${plansError.message}`);
    process.exit(1);
  }

  console.log("\nPlanes en Supabase:");
  console.table(plans);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
