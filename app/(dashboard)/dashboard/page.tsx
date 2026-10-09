import Link from "next/link";
import { createServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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

  let plan = null;
  let usagePeriod = null;

  if (agencyId) {
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
    <div className="min-h-full text-[#111827]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#111827]">Dashboard</h1>
        </header>

        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#6B7280]">Plan actual</p>
              <p className="mt-1 text-xl font-bold text-[#111827]">{plan?.name ?? "Sin plan"}</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/properties"
                className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#111827] transition hover:bg-[#F9FAFB]"
              >
                Ver propiedades
              </Link>
              <a
                href="/billing"
                className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#6B7280] transition hover:bg-[#F9FAFB]"
              >
                Cambiar plan
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-[#6B7280]">Videos usados</p>
            <p className="mt-3 text-3xl font-bold text-[#111827]">{videosUsed}</p>
            <p className="mt-1 text-sm text-[#6B7280]">/ {videoLimit}</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-[#6B7280]">Fotos usadas</p>
            <p className="mt-3 text-3xl font-bold text-[#111827]">{photosUsed}</p>
            <p className="mt-1 text-sm text-[#6B7280]">/ {photoLimit}</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-[#6B7280]">Créditos disponibles</p>
            <p className="mt-3 text-3xl font-bold text-[#111827]">{creditsAvailable}</p>
            <p className="mt-1 text-sm text-[#6B7280]">Este mes</p>
          </div>
        </section>

      </div>
    </div>
  );
}
