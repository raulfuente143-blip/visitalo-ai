import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { createServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
    <div className="mx-auto max-w-6xl text-[#111827]">
      <Breadcrumb items={[{ label: "Videos", href: "/videos" }]} />
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Videos</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Videos generados durante los últimos 30 días.</p>
      </header>

      {videos?.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {videos.map((video) => {
            const property = Array.isArray(video.properties) ? video.properties[0] : video.properties;
            const createdAt = new Date(video.created_at).toLocaleString("es-ES", {
              dateStyle: "medium",
              timeStyle: "short",
            });

            return (
              <article key={video.id} className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-[#111827]">
                      {property?.address || "Propiedad sin dirección"}
                    </h2>
                    <p className="mt-2 text-sm text-[#6B7280]">{createdAt}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[video.status] ?? statusStyles.pending}`}
                  >
                    {statusLabels[video.status] ?? video.status}
                  </span>
                </div>

                {video.status === "completed" ? (
                  <Link
                    href={`/videos/${video.id}`}
                    className="mt-5 inline-flex rounded-lg bg-[#111827] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1F2937]"
                  >
                    Ver video
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="font-medium text-[#111827]">No hay videos de los últimos 30 días.</p>
        </div>
      )}
    </div>
  );
}
