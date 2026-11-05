import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";
import { PropertyFloorPlanEditor } from "@/components/property-floor-plan-editor";
import { PageHeader, buttonStyles } from "@/components/panel-ui";

export default async function PropertyEditorPage({
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
    .select("id, name, address, internal_reference, status, floor_plan_url")
    .eq("id", id)
    .maybeSingle();

  if (!property) {
    redirect("/properties");
  }

  const { data: zones } = await supabase
    .from("property_zones")
    .select("id, property_id, name, room_order, points")
    .eq("property_id", id)
    .order("room_order", { ascending: true });

  const zoneIds = (zones ?? []).map((zone) => zone.id);
  const { data: zonePhotos } = zoneIds.length
    ? await supabase
        .from("property_zone_photos")
        .select("id, zone_id, photo_slot, url")
        .in("zone_id", zoneIds)
        .order("photo_slot", { ascending: true })
    : { data: [] };

  const zonesWithPhotos = (zones ?? []).map((zone) => ({
    ...zone,
    photos: (zonePhotos ?? []).filter((photo) => photo.zone_id === zone.id),
  }));

  const description = [property.address, property.internal_reference ? `Ref. ${property.internal_reference}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={property.name || "Propiedad"}
        description={description}
        action={
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <Link href="/properties" className={buttonStyles.secondary}>
              Volver
            </Link>
            <Link href={`/properties/${property.id}/video`} className={buttonStyles.primary}>
              Crear video
            </Link>
          </div>
        }
      />

      <PropertyFloorPlanEditor
        propertyId={property.id}
        initialFloorPlanUrl={property.floor_plan_url}
        initialZones={zonesWithPhotos}
      />
    </div>
  );
}
