import { createServerComponentClient } from "@/lib/supabase/server";
import { PropertyFloorPlanEditor } from "@/components/property-floor-plan-editor";
import { PropertyZonePhotos } from "@/components/property-zone-photos";
import { Breadcrumb } from "@/components/breadcrumb";
import { redirect } from "next/navigation";

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

  return (
    <div className="mx-auto max-w-7xl text-[#111827]">
      <Breadcrumb
        items={[
          { label: "Propiedades", href: "/properties" },
          { label: property.name, href: `/properties/${property.id}/editor` },
          { label: "Editor", href: `/properties/${property.id}/editor` },
        ]}
      />
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{property.name}</h1>
          <p className="mt-1 text-sm text-[#6B7280]">{property.address}</p>
        </div>
        <a
          href="/properties"
          className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] transition hover:bg-[#F9FAFB]"
        >
          Volver a propiedades
        </a>
      </div>

      <PropertyFloorPlanEditor
        propertyId={property.id}
        initialFloorPlanUrl={property.floor_plan_url}
        initialZones={zonesWithPhotos}
      />
    </div>
  );
}
