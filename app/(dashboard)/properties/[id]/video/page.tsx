import { createServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GenerateVideoButton } from "@/components/generate-video-button";
import { Breadcrumb } from "@/components/breadcrumb";

export default async function PropertyVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, name, address")
    .eq("id", id)
    .maybeSingle();

  if (propertyError) {
    throw new Error(propertyError.message);
  }

  if (!property) {
    redirect("/properties");
  }

  const { data: agencyMember } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .eq("agency_id", (await supabase.from("properties").select("agency_id").eq("id", id).maybeSingle()).data?.agency_id)
    .maybeSingle();

  if (!agencyMember?.agency_id) {
    redirect("/properties");
  }

  const { data: zones, error: zonesError } = await supabase
    .from("property_zones")
    .select("id, name, room_order, property_zone_photos(id, url, photo_slot)")
    .eq("property_id", id)
    .order("room_order", { ascending: true });

  if (zonesError) {
    throw new Error(zonesError.message);
  }

  const zonesWithPhotos = (zones ?? []).map((zone) => ({
    ...zone,
    photos: [...(zone.property_zone_photos ?? [])].sort((a, b) => a.photo_slot - b.photo_slot),
  }));

  const hasPhotos = zonesWithPhotos.some((zone) => zone.photos.length > 0);

  return (
    <div className="mx-auto max-w-5xl text-[#111827]">
        <Breadcrumb
          items={[
            { label: "Propiedades", href: "/properties" },
            { label: property.name, href: `/properties/${id}/video` },
            { label: "Generar video", href: `/properties/${id}/video` },
          ]}
        />
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{property.name}</h1>
            <p className="mt-1 text-sm text-[#6B7280]">{property.address}</p>
          </div>
          <a
            href={`/properties/${id}/editor`}
            className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] transition hover:bg-[#F9FAFB]"
          >
            Volver al plano
          </a>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          {hasPhotos ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#111827]">Habitaciones con fotos</h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  El video recorrerá las habitaciones en el orden definido por el plano.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {zonesWithPhotos.map((zone) => (
                  <article key={zone.id} className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-[#111827]">{zone.name}</h3>
                      <span className="text-xs text-[#6B7280]">Habitación {zone.room_order}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {zone.photos.map((photo) => (
                        <img
                          key={photo.id}
                          src={photo.url}
                          alt={`${zone.name} ${photo.photo_slot}`}
                          className="h-32 w-full rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  </article>
                ))}
              </div>

              <GenerateVideoButton propertyId={id} />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] p-10 text-center">
              <p className="text-lg font-semibold text-[#111827]">
                Añade fotos al plano antes de generar el video
              </p>
            </div>
          )}
        </section>
    </div>
  );
}
