import Link from "next/link";
import { Suspense } from "react";
import { saveAgencyProfile } from "@/app/actions/auth";
import { OnboardingLogoUploader } from "@/components/onboarding-logo-uploader";
import { createServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const error = params.error ? decodeURIComponent(params.error) : "";

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
    .select("agency_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  const agencyId = agencyMember?.agency_id;

  let agency = null;
  let plan = null;
  let usagePeriod = null;

  if (agencyId) {
    const { data: agencyData } = await supabase
      .from("agencies")
      .select("id, name, logo_url, brand_primary_color, brand_secondary_color")
      .eq("id", agencyId)
      .maybeSingle();

    agency = agencyData;

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan_id, status")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscription?.plan_id) {
      const { data: planData } = await supabase
        .from("plans")
        .select("id, code, name, video_limit, photo_limit, credit_limit")
        .eq("id", subscription.plan_id)
        .maybeSingle();

      plan = planData;
    }

    if (!plan) {
      const { data: defaultPlan } = await supabase
        .from("plans")
        .select("id, code, name, video_limit, photo_limit, credit_limit")
        .eq("code", "starter")
        .maybeSingle();

      plan = defaultPlan;
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const { data: usageData } = await supabase
      .from("usage_periods")
      .select("videos_used, photos_used, credits_available")
      .eq("agency_id", agencyId)
      .gte("period_start", monthStart.toISOString())
      .lte("period_end", monthEnd.toISOString())
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    usagePeriod = usageData;
  }

  const videoLimit = plan?.video_limit ?? 0;
  const photoLimit = plan?.photo_limit ?? 0;
  const creditLimit = plan?.credit_limit ?? 0;

  const videosUsed = usagePeriod?.videos_used ?? 0;
  const photosUsed = usagePeriod?.photos_used ?? 0;
  const creditsAvailable = usagePeriod?.credits_available ?? creditLimit;

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold">{agency?.name ?? "Mi agencia"}</h1>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>Usuario</p>
            <p className="font-medium text-slate-700">{user.email}</p>
          </div>
        </header>

        {!agency ? (
          <section className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-700">
                  Perfil de agencia
                </p>
                <h2 className="mt-2 text-2xl font-bold text-amber-900">
                  Completa la configuración de tu agencia
                </h2>
                <p className="mt-2 text-sm text-amber-800">
                  Aún no has configurado el nombre, logo ni los colores de tu marca.
                </p>
              </div>
              <a
                href="#agency-settings"
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-500"
              >
                Configurar ahora
              </a>
            </div>
          </section>
        ) : null}

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Plan actual</p>
              <p className="mt-1 text-xl font-bold">{plan?.name ?? "Sin plan"}</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/properties"
                className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
              >
                Ver propiedades
              </Link>
              <a
                href="/billing"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Cambiar plan
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Videos usados</p>
            <p className="mt-3 text-3xl font-bold">{videosUsed}</p>
            <p className="mt-1 text-sm text-slate-500">/ {videoLimit}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Fotos usadas</p>
            <p className="mt-3 text-3xl font-bold">{photosUsed}</p>
            <p className="mt-1 text-sm text-slate-500">/ {photoLimit}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Créditos disponibles</p>
            <p className="mt-3 text-3xl font-bold">{creditsAvailable}</p>
            <p className="mt-1 text-sm text-slate-500">Este mes</p>
          </div>
        </section>

        <section id="agency-settings" className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Ajustes</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              {agency ? "Editar perfil de la agencia" : "Configurar perfil de la agencia"}
            </h2>
          </div>

          <form action={saveAgencyProfile} className="space-y-6">
            <div>
              <label htmlFor="agencyName" className="mb-2 block text-sm font-medium text-slate-700">
                Nombre de la agencia
              </label>
              <input
                id="agencyName"
                name="agencyName"
                type="text"
                defaultValue={agency?.name ?? ""}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none ring-0 transition focus:border-sky-500 focus:bg-white"
              />
            </div>

            <Suspense fallback={<div className="text-sm text-slate-500">Cargando uploader…</div>}>
              <OnboardingLogoUploader />
            </Suspense>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="primaryColor" className="mb-2 block text-sm font-medium text-slate-700">
                  Color principal
                </label>
                <input
                  id="primaryColor"
                  name="primaryColor"
                  type="color"
                  defaultValue={agency?.brand_primary_color ?? "#0F172A"}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 p-1"
                />
              </div>

              <div>
                <label htmlFor="secondaryColor" className="mb-2 block text-sm font-medium text-slate-700">
                  Color secundario
                </label>
                <input
                  id="secondaryColor"
                  name="secondaryColor"
                  type="color"
                  defaultValue={agency?.brand_secondary_color ?? "#F59E0B"}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 p-1"
                />
              </div>
            </div>

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800"
            >
              Guardar perfil
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
