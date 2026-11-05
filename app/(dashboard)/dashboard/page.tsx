import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";
import { Card, PageHeader, buttonStyles } from "@/components/panel-ui";

export const dynamic = "force-dynamic";

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

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function StatCard({
  label,
  value,
  detail,
  percent,
  className = "",
}: {
  label: string;
  value: number | string;
  detail: string;
  percent?: number;
  className?: string;
}) {
  return (
    <Card className={className}>
      <p className="text-xs font-medium text-[#6B7280] sm:text-sm">{label}</p>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tracking-tight tabular-nums text-[#0F172A]">{value}</span>
        <span className="text-sm text-[#9CA3AF]">{detail}</span>
      </p>
      {typeof percent === "number" ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#F1F1F1]">
          <div className="h-full rounded-full bg-[#D4AF37] transition-all" style={{ width: `${percent}%` }} />
        </div>
      ) : null}
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

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.agency_id) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Inicio" description="Empieza configurando tu agencia." />
        <Card>
          <p className="text-lg font-semibold text-[#0F172A]">Configura tu agencia</p>
          <p className="mt-1 text-sm text-pretty text-[#6B7280]">
            Añade el nombre, el logo y el color de tu agencia para que aparezcan en tus videos.
          </p>
          <Link href="/settings" className={`${buttonStyles.primary} mt-4`}>
            Configurar agencia
          </Link>
        </Card>
      </div>
    );
  }

  const { data: usageData } = await supabase.rpc("get_agency_usage", { p_agency_id: membership.agency_id });
  const usage = (Array.isArray(usageData) ? usageData[0] : usageData) as Usage | null;

  const used = usage?.videos_used ?? 0;
  const limit = usage?.video_limit ?? 0;
  const remaining = Math.max(limit - used, 0);
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isTrial = usage?.is_trial ?? true;

  let statusLine = "No se ha podido cargar tu plan.";
  if (usage && isTrial) {
    statusLine =
      remaining > 0
        ? `Prueba gratuita · ${remaining === 1 ? "te queda 1 video" : `te quedan ${remaining} videos`}`
        : "Has terminado la prueba gratuita.";
  } else if (usage?.subscription_status === "past_due") {
    statusLine = "Hay un pago pendiente. Actualiza tu tarjeta en Facturación.";
  } else if (usage?.cancel_at_period_end) {
    statusLine = `Se cancelará el ${formatDate(usage.period_end)}.`;
  } else if (usage) {
    statusLine = `Se renueva el ${formatDate(usage.period_end)}.`;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Inicio"
        description={isTrial ? "Tu prueba gratuita." : "Tu actividad de este periodo."}
        action={
          <Link href="/properties/new" className={`${buttonStyles.primary} w-full sm:w-auto`}>
            Nueva propiedad
          </Link>
        }
      />

      {usage && remaining === 0 ? (
        <section className="mb-5 rounded-2xl border border-[#D4AF37]/50 bg-[#D4AF37]/[0.06] p-5 sm:p-6">
          <p className="font-semibold text-[#0F172A]">
            {isTrial ? "Has usado tu prueba gratuita." : "Has usado todos los videos de este periodo."}
          </p>
          <p className="mt-1 text-sm text-pretty text-[#6B7280]">
            {isTrial
              ? "Elige un plan para seguir creando videos con la identidad de tu agencia."
              : "Podrás crear más cuando se renueve tu plan, o puedes pasar a un plan superior."}
          </p>
          <Link href="/billing" className={`${buttonStyles.primary} mt-4`}>
            {isTrial ? "Elegir plan" : "Ver planes"}
          </Link>
        </section>
      ) : null}

      <Card className="mb-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-[#6B7280]">Plan actual</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-[#0F172A]">{usage?.plan_name ?? "—"}</p>
          <p className="mt-1 text-sm text-pretty text-[#6B7280]">{statusLine}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Link href="/properties" className={buttonStyles.secondary}>
            Ver propiedades
          </Link>
          <Link href="/billing" className={isTrial ? buttonStyles.primary : buttonStyles.secondary}>
            {isTrial ? "Elegir plan" : "Facturación"}
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        <StatCard label="Videos usados" value={used} detail={`de ${limit}`} percent={percent} />
        <StatCard label="Videos disponibles" value={remaining} detail={isTrial ? "en la prueba" : "este periodo"} />
        <StatCard
          label="Habitaciones por video"
          value={usage?.max_rooms ?? 0}
          detail="como máximo"
          className="col-span-2 lg:col-span-1"
        />
      </div>
    </div>
  );
}
