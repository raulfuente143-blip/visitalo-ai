import Link from "next/link";
import { DeleteVideoButton } from "@/components/delete-video-button";
import { VideoCardPreview } from "@/components/video-card-preview";
import { createServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, PageHeader, buttonStyles } from "@/components/panel-ui";

const statusStyles: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  processing: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  completed: "Completado",
  failed: "Fallido",
};

export default async function VideosPage() {
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
    redirect("/dashboard");
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("id", membership.agency_id)
    .maybeSingle();

  if (!agency) {
    redirect("/dashboard");
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: videos } = await supabase
    .from("videos")
    .select("id, status, output_url, created_at, properties(address)")
    .eq("agency_id", agency.id)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Videos" description="Videos generados durante los últimos 30 días." />

      {videos?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
          {videos.map((video) => {
            const property = Array.isArray(video.properties) ? video.properties[0] : video.properties;
            const createdAt = new Date(video.created_at).toLocaleString("es-ES", {
              dateStyle: "medium",
              timeStyle: "short",
            });

            return (
              <article
                key={video.id}
                className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
              >
                {video.status === "completed" && video.output_url ? (
                  <VideoCardPreview src={video.output_url} />
                ) : null}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 font-medium text-[#0F172A]">
                        {property?.address || "Propiedad sin dirección"}
                      </h2>
                      <p className="mt-1 text-sm text-[#6B7280]">{createdAt}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[video.status] ?? statusStyles.pending}`}
                    >
                      {statusLabels[video.status] ?? video.status}
                    </span>
                  </div>

                  {video.status === "completed" && video.output_url ? (
                    <div className="mt-4 flex items-center gap-2">
                      <Link href={`/videos/${video.id}`} className={`${buttonStyles.dark} flex-1 sm:flex-none`}>
                        Ver video
                      </Link>
                      <DeleteVideoButton videoId={video.id} />
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Card className="py-12 text-center">
          <p className="text-lg font-semibold text-[#0F172A]">Aún no hay videos</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-pretty text-[#6B7280]">
            Abre una propiedad, define sus habitaciones y genera tu primer video.
          </p>
          <Link href="/properties" className={`${buttonStyles.primary} mt-6`}>
            Ir a propiedades
          </Link>
        </Card>
      )}
    </div>
  );
}
