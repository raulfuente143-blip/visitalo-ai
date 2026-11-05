import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";
import { GenerateVideoButton } from "@/components/generate-video-button";
import { Card, PageHeader, buttonStyles } from "@/components/panel-ui";

type PhotoRow = { id: string; url: string; photo_slot: number };
type ZoneRow = {
  id: string;
  name: string;
  room_order: number;
  property_zone_photos: PhotoRow[] | null;
};

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

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

  const { data: property } = await supabase
    .from("properties")
    .select("id, name, address, internal_reference, agency_id")
    .eq("id", id)
    .maybeSingle();

  if (!property) {
    redirect("/properties");
  }

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .eq("agency_id", property.agency_id)
    .maybeSingle();

  if (!membership?.agency_id) {
    redirect("/properties");
  }

  const { data: zonesData } = await supabase
    .from("property_zones")
    .select("id, name, room_order, property_zone_photos(id, url, photo_slot)")
    .eq("property_id", id)
    .order("room_order", { ascending: true });

  const zones = ((zonesData ?? []) as ZoneRow[]).map((zone) => ({
    ...zone,
    photos: [...(zone.property_zone_photos ?? [])]
      .filter((photo) => Boolean(photo.url))
      .sort((a, b) => a.photo_slot - b.photo_slot),
  }));

  const zonesWithPhotos = zones.filter((zone) => zone.photos.length > 0);
  const photoCount = zonesWithPhotos.reduce((sum, zone) => sum + Math.min(zone.photos.length, 2), 0);
  const seconds = zonesWithPhotos.reduce((sum, zone) => sum + (zone.photos.length > 1 ? 4 : 3), 0);
  const description = [property.name, property.address, property.internal_reference ? `Ref. ${property.internal_reference}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Crear video"
        description={description}
        action={
          <Link href={`/properties/${id}/editor`} className={`${buttonStyles.secondary} w-full sm:w-auto`}>
            Volver al editor
          </Link>
        }
      />

      {zonesWithPhotos.length > 0 ? (
        <>
          <Card className="mb-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="text-lg font-semibold text-[#0F172A]">Listo para crear el video</h2>
              <p className="text-sm text-[#6B7280]">
                {plural(zonesWithPhotos.length, "habitación", "habitaciones")} · {plural(photoCount, "foto", "fotos")} · unos{" "}
                {seconds} segundos
              </p>
            </div>
            <p className="mt-1 text-sm text-pretty text-[#6B7280]">
              El video recorrerá las habitaciones en el orden del plano, con el logo y el color de tu agencia.
            </p>
            <div className="mt-5">
              <GenerateVideoButton propertyId={id} />
            </div>
          </Card>

          <h2 className="mb-3 text-sm font-medium text-[#6B7280]">Habitaciones del recorrido</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {zones.map((zone) => (
              <article
                key={zone.id}
                className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0F172A] text-xs font-semibold text-white">
                    {zone.room_order}
                  </span>
                  <h3 className="min-w-0 truncate font-medium text-[#0F172A]">{zone.name}</h3>
                </div>
                {zone.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {zone.photos.slice(0, 2).map((photo) => (
                      <img
                        key={photo.id}
                        src={photo.url}
                        alt={`${zone.name}, foto ${photo.photo_slot}`}
                        className="aspect-[4/3] w-full rounded-xl object-cover"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl bg-[#FAFAFA] px-3 py-4 text-center text-xs text-[#9CA3AF]">
                    Sin fotos · no saldrá en el video
                  </p>
                )}
              </article>
            ))}
          </div>
        </>
      ) : (
        <Card className="py-12 text-center">
          <p className="text-lg font-semibold text-[#0F172A]">Añade fotos antes de crear el video</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-pretty text-[#6B7280]">
            En el editor, marca las habitaciones sobre el plano y sube hasta 2 fotos de cada una.
          </p>
          <Link href={`/properties/${id}/editor`} className={`${buttonStyles.primary} mt-6`}>
            Ir al editor
          </Link>
        </Card>
      )}
    </div>
  );
}
