"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addStoragePath, groupStoragePaths } from "@/lib/storage-paths";

export async function createProperty(formData: FormData) {
  const supabase = await createServerComponentClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const address = String(formData.get("address") ?? "").trim();
  const internalReference = String(formData.get("internalReference") ?? "").trim();

  if (!address) {
    redirect("/properties/new?error=La+direcci%C3%B3n+es+obligatoria");
  }

  const { data: agencyMember } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!agencyMember?.agency_id) {
    redirect("/dashboard");
  }

  const propertyName = address.length > 80 ? `${address.slice(0, 77)}...` : address;

  const { data, error } = await supabase
    .from("properties")
    .insert({
      agency_id: agencyMember.agency_id,
      name: propertyName,
      address,
      internal_reference: internalReference || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    redirect(`/properties/new?error=${encodeURIComponent(error?.message ?? "No+se+puedo+crear+la+propiedad")}`);
  }

  redirect(`/properties/${data.id}/editor`);
}

export type DeleteResult = { ok: true } | { ok: false; error: string };

export async function deleteProperty(propertyId: string): Promise<DeleteResult> {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  }

  const { data: property } = await supabase
    .from("properties")
    .select("id, agency_id, floor_plan_url")
    .eq("id", propertyId)
    .maybeSingle();

  if (!property) {
    return { ok: false, error: "No se ha encontrado la propiedad." };
  }

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .eq("agency_id", property.agency_id)
    .maybeSingle();

  if (!membership) {
    return { ok: false, error: "No tienes permiso para eliminar esta propiedad." };
  }

  const admin = createAdminClient();
  const failure: DeleteResult = { ok: false, error: "No se ha podido eliminar la propiedad. Inténtalo de nuevo." };

  const { data: zones } = await admin.from("property_zones").select("id").eq("property_id", propertyId);
  const zoneIds = (zones ?? []).map((zone: { id: string }) => zone.id);

  const { data: photos } = zoneIds.length
    ? await admin.from("property_zone_photos").select("url").in("zone_id", zoneIds)
    : { data: [] as { url: string | null }[] };

  const { data: videos } = await admin.from("videos").select("id, output_url").eq("property_id", propertyId);
  const videoIds = (videos ?? []).map((video: { id: string }) => video.id);

  const urls: (string | null)[] = [
    property.floor_plan_url,
    ...(photos ?? []).map((photo: { url: string | null }) => photo.url),
    ...(videos ?? []).map((video: { output_url: string | null }) => video.output_url),
  ];

  // 1) Base de datos. Si algo falla aquí, no se toca ningún archivo.
  if (videoIds.length) {
    const { error: jobsError } = await admin.from("video_jobs").delete().in("video_id", videoIds);
    if (jobsError) return failure;
    const { error: videosError } = await admin.from("videos").delete().in("id", videoIds);
    if (videosError) return failure;
  }

  if (zoneIds.length) {
    const { error: photosError } = await admin.from("property_zone_photos").delete().in("zone_id", zoneIds);
    if (photosError) return failure;
    const { error: zonesError } = await admin.from("property_zones").delete().in("id", zoneIds);
    if (zonesError) return failure;
  }

  const { error: propertyError } = await admin.from("properties").delete().eq("id", propertyId);
  if (propertyError) return failure;

  // 2) Archivos. Si alguno falla, se registra pero la propiedad ya está borrada.
  const byBucket = groupStoragePaths(urls);

  const { data: leftoverVideos } = await admin.storage.from("property-videos").list(propertyId, { limit: 1000 });
  for (const file of leftoverVideos ?? []) {
    addStoragePath(byBucket, "property-videos", `${propertyId}/${file.name}`);
  }

  const { data: leftoverPlans } = await admin.storage.from("floor-plans").list(`properties/${propertyId}`, { limit: 1000 });
  for (const file of leftoverPlans ?? []) {
    addStoragePath(byBucket, "floor-plans", `properties/${propertyId}/${file.name}`);
  }

  for (const [bucket, paths] of Array.from(byBucket.entries())) {
    const { error: storageError } = await admin.storage.from(bucket).remove(Array.from(paths));
    if (storageError) {
      console.error(`[deleteProperty] No se pudieron borrar archivos de ${bucket}:`, storageError.message);
    }
  }

  revalidatePath("/properties");
  revalidatePath("/videos");
  revalidatePath("/dashboard");
  return { ok: true };
}
