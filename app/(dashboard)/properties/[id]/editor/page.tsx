import { createServerComponentClient } from "@/lib/supabase/server";
import { PropertyFloorPlanEditor } from "@/components/property-floor-plan-editor";
import { PropertyZonePhotos } from "@/components/property-zone-photos";
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
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Editor</p>
            <h1 className="mt-2 text-3xl font-bold">{property.name}</h1>
            <p className="mt-2 text-sm text-slate-500">{property.address}</p>
          </div>
          <a
            href="/properties"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
    </main>
  );
}
