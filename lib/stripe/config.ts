import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2026-08-26.dahlia",
    })
  : null;

export function getStripe() {
  if (!stripe) {
    throw new Error("Missing STRIPE_SECRET_KEY. Add the key to your environment before using Stripe.");
  }

  return stripe;
}

export const plans = {
  starter: {
    id: "starter",
    name: "Starter",
    amount: 2000,
    currency: "eur",
    description: "Plan ideal para empezar con pocos videos y fotos.",
    limits: {
      videos: 50,
      photos: 500,
      credits: 100,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    amount: 4500,
    currency: "eur",
    description: "Para agencias que necesitan más volumen y automatización.",
    limits: {
      videos: 150,
      photos: 2000,
      credits: 250,
    },
  },
  agencia: {
    id: "agencia",
    name: "Agencia",
    amount: 10000,
    currency: "eur",
    description: "Para equipos con mucha producción y gestión centralizada.",
    limits: {
      videos: 400,
      photos: 8000,
      credits: 800,
    },
  },
} as const;
