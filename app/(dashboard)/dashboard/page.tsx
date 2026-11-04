import Link from "next/link";
import { createServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, PageHeader, buttonStyles } from "@/components/panel-ui";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  detail,
  className = "",
}: {
  label: string;
  value: number | string;
  detail: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <p className="text-xs font-medium text-[#6B7280] sm:text-sm">{label}</p>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tracking-tight tabular-nums text-[#0F172A]">{value}</span>
        <span className="text-sm text-[#9CA3AF]">{detail}</span>
      </p>
    </Card>
  );
}

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
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Inicio"
        description="Tu actividad de este mes."
        action={
          <Link href="/properties/new" className={`${buttonStyles.primary} w-full sm:w-auto`}>
            Nueva propiedad
          </Link>
        }
      />

      <Card className="mb-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[#6B7280]">Plan actual</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-[#0F172A]">{plan?.name ?? "Sin plan"}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Link href="/properties" className={buttonStyles.secondary}>
            Ver propiedades
          </Link>
          <a href="/billing" className={buttonStyles.secondary}>
            Cambiar plan
          </a>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        <StatCard label="Videos usados" value={videosUsed} detail={`de ${videoLimit}`} />
        <StatCard label="Fotos usadas" value={photosUsed} detail={`de ${photoLimit}`} />
        <StatCard
          label="Créditos disponibles"
          value={creditsAvailable}
          detail="este mes"
          className="col-span-2 lg:col-span-1"
        />
      </div>
    </div>
  );
}
