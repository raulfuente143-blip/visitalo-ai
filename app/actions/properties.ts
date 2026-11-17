"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addStoragePath, groupStoragePaths } from "@/lib/storage-paths";

// Lista todos los archivos de una carpeta de Storage, entrando en subcarpetas (hasta 2 niveles).
async function listFiles(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  prefix: string,
  depth = 2,
): Promise<string[]> {
  const { data } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  const files: string[] = [];
  for (const entry of data ?? []) {
    const fullPath = `${prefix}/${entry.name}`;
    if (!entry.id) {
      if (depth > 0) files.push(...(await listFiles(admin, bucket, fullPath, depth - 1)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

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

  if (address.length > 200 || internalReference.length > 50) {
    redirect(`/properties/new?error=${encodeURIComponent("La dirección admite hasta 200 caracteres y la referencia hasta 50.")}`);
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
    redirect(`/properties/new?error=${encodeURIComponent("No se ha podido crear la propiedad. Inténtalo de nuevo.")}`);
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

  const leftoverFolders: [string, string][] = [
    ["property-videos", propertyId],
    ["floor-plans", `properties/${propertyId}`],
    ["property-photos", `properties/${propertyId}`],
  ];
  for (const [bucket, prefix] of leftoverFolders) {
    for (const path of await listFiles(admin, bucket, prefix)) {
      addStoragePath(byBucket, bucket, path);
    }
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

// Edita la dirección y la referencia de una propiedad. El nombre se recalcula a partir de la
// dirección, igual que al crearla. Las reglas de acceso (RLS) impiden tocar propiedades ajenas.
export async function updatePropertyDetails(
  propertyId: string,
  input: { address: string; internalReference: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createServerComponentClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  }

  const address = String(input?.address ?? "").trim();
  const internalReference = String(input?.internalReference ?? "").trim();

  if (!address) {
    return { ok: false, error: "La dirección es obligatoria." };
  }
  if (address.length > 200) {
    return { ok: false, error: "La dirección no puede tener más de 200 caracteres." };
  }
  if (internalReference.length > 50) {
    return { ok: false, error: "La referencia no puede tener más de 50 caracteres." };
  }

  const name = address.length > 80 ? `${address.slice(0, 77)}...` : address;

  const { data, error } = await supabase
    .from("properties")
    .update({
      name,
      address,
      internal_reference: internalReference || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "No se han podido guardar los cambios. Inténtalo de nuevo." };
  }

  revalidatePath("/properties");
  revalidatePath(`/properties/${propertyId}/editor`);
  revalidatePath(`/properties/${propertyId}/video`);
  revalidatePath("/videos");
  return { ok: true };
}
