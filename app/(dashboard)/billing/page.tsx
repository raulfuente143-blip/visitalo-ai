import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createCheckoutSession, createPortalSession } from "@/app/actions/checkout";
import { Card, PageHeader, buttonStyles } from "@/components/panel-ui";

type Usage = {
  plan_code: string;
  plan_name: string;
  is_trial: boolean;
  video_limit: number;
  videos_used: number;
  max_rooms: number;
  subscription_status: string | null;
  period_end: string | null;
  cancel_at_period_end: boolean;
};

type PlanRow = {
  code: string;
  name: string;
  description: string | null;
  monthly_price_cents: number;
  video_limit: number;
  max_rooms: number;
  max_users: number;
  sort_order: number;
};

const upcomingPro = ["Optimizador de fotos ilimitado", "Staging virtual: 3 al mes"];

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function formatPrice(cents: number) {
  return `${(cents / 100).toLocaleString("es-ES")} €`;
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<{ checkout?: string; error?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const error = params.error ? decodeURIComponent(params.error) : "";

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
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Facturación" description="Tu plan, tu consumo y tus facturas." />
        <Card>
          <p className="text-sm text-[#6B7280]">Antes de elegir un plan, completa el perfil de tu agencia.</p>
          <Link href="/settings" className={`${buttonStyles.primary} mt-4`}>
            Completar perfil
          </Link>
        </Card>
      </div>
    );
  }

  const agencyId = membership.agency_id as string;

  const [{ data: usageData }, { data: plansData }, { data: subscription }] = await Promise.all([
    supabase.rpc("get_agency_usage", { p_agency_id: agencyId }),
    supabase
      .from("plans")
      .select("code, name, description, monthly_price_cents, video_limit, max_rooms, max_users, sort_order")
      .eq("is_active", true)
      .eq("is_trial", false)
      .order("sort_order", { ascending: true }),
    supabase.from("subscriptions").select("stripe_customer_id").eq("agency_id", agencyId).maybeSingle(),
  ]);

  const usage = (Array.isArray(usageData) ? usageData[0] : usageData) as Usage | null;
  const plans = (plansData ?? []) as PlanRow[];
  const isSubscribed = Boolean(usage && !usage.is_trial);
  const canManage = Boolean(subscription?.stripe_customer_id);

  let statusLine = "No se ha podido cargar tu plan.";
  if (usage?.is_trial) {
    statusLine = `Prueba gratuita · ${usage.videos_used} de ${usage.video_limit} videos usados`;
  } else if (usage?.subscription_status === "past_due") {
    statusLine = "Hay un pago pendiente. Actualiza tu tarjeta para no perder el acceso.";
  } else if (usage?.cancel_at_period_end) {
    statusLine = `Se cancelará el ${formatDate(usage.period_end)}. Hasta entonces puedes seguir usándolo.`;
  } else if (usage) {
    statusLine = `Activo · Se renueva el ${formatDate(usage.period_end)} · ${usage.videos_used} de ${usage.video_limit} videos usados`;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Facturación" description="Tu plan, tu consumo y tus facturas." />

      {params.checkout === "success" ? (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          ✓ Pago completado. Tu plan se activa en unos segundos; si no lo ves, recarga la página.
        </div>
      ) : null}
      {params.checkout === "cancelled" ? (
        <div className="mb-5 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#6B7280]">
          Has cancelado el pago. No se ha cobrado nada.
        </div>
      ) : null}
      {error ? (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <Card className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-[#6B7280]">Plan actual</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-[#0F172A]">{usage?.plan_name ?? "—"}</p>
          <p className="mt-1 text-sm text-pretty text-[#6B7280]">{statusLine}</p>
        </div>
        {canManage ? (
          <form action={createPortalSession}>
            <button type="submit" className={`${buttonStyles.dark} w-full sm:w-auto`}>
              Gestionar suscripción
            </button>
          </form>
        ) : null}
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        {plans.map((plan) => {
          const isPro = plan.code === "pro";
          const isCurrent = isSubscribed && usage?.plan_code === plan.code;

          return (
            <section
              key={plan.code}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-7 ${
                isPro ? "border-[#D4AF37]/60" : "border-black/[0.06]"
              }`}
            >
              {isPro ? (
                <span className="absolute -top-3 left-6 rounded-full bg-[#D4AF37] px-3 py-1 text-xs font-bold text-[#0F172A]">
                  Recomendado
                </span>
              ) : null}
              <h2 className="text-lg font-semibold text-[#0F172A]">{plan.name}</h2>
              {plan.description ? <p className="mt-1 text-sm text-[#6B7280]">{plan.description}</p> : null}
              <p className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-[#0F172A]">
                  {formatPrice(plan.monthly_price_cents)}
                </span>
                <span className="text-sm text-[#6B7280]">/mes + IVA</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-[#374151]">
                <li className="flex gap-3"><span className="text-[#D4AF37]">✓</span><span>{plan.video_limit} videos al mes</span></li>
                <li className="flex gap-3"><span className="text-[#D4AF37]">✓</span><span>Hasta {plan.max_rooms} habitaciones · 2 fotos cada una</span></li>
                <li className="flex gap-3"><span className="text-[#D4AF37]">✓</span><span>Logo y color de marca</span></li>
                <li className="flex gap-3"><span className="text-[#D4AF37]">✓</span><span>{plan.max_users} usuarios</span></li>
                {isPro
                  ? upcomingPro.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="text-[#D4AF37]">✓</span>
                        <span>
                          {item}{" "}
                          <span className="ml-1 inline-block whitespace-nowrap rounded-full border border-[#D4AF37]/40 px-2 py-0.5 align-middle text-[10px] uppercase tracking-wider text-[#B8960C]">
                            Próximamente
                          </span>
                        </span>
                      </li>
                    ))
                  : null}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <span className={`${buttonStyles.secondary} w-full cursor-default opacity-70`}>Tu plan actual</span>
                ) : isSubscribed && canManage ? (
                  <form action={createPortalSession}>
                    <button type="submit" className={`${buttonStyles.secondary} w-full`}>
                      Cambiar a {plan.name}
                    </button>
                  </form>
                ) : (
                  <form action={createCheckoutSession}>
                    <input type="hidden" name="plan" value={plan.code} />
                    <button type="submit" className={`${isPro ? buttonStyles.primary : buttonStyles.dark} w-full`}>
                      Elegir {plan.name}
                    </button>
                  </form>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-6 text-center text-sm text-pretty text-[#6B7280]">
        Precios sin IVA. Suscripción mensual por oficina, sin permanencia: cancela cuando quieras.
      </p>
    </div>
  );
}
