"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { groupPropertyStoragePaths, isOwnedStorageUrl } from "@/lib/storage-paths";

async function getAuthenticatedProperty(propertyId: string) {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  if (!membership?.agency_id) {
    redirect("/dashboard");
  }

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("agency_id", membership.agency_id)
    .maybeSingle();

  if (propertyError) {
    throw new Error(propertyError.message);
  }

  if (!property) {
    redirect("/properties");
  }

  return { supabase, user, property };
}

// Borra de Storage los archivos que ya no usa nadie. Si falla, solo se registra:
// el cambio que ha pedido el usuario ya está guardado.
async function removeStorageFiles(propertyId: string, urls: (string | null | undefined)[]) {
  // Solo se borran archivos de la carpeta de ESTA propiedad (auditoría C1).
  const byBucket = groupPropertyStoragePaths(urls, propertyId);
  if (byBucket.size === 0) return;

  const admin = createAdminClient();
  for (const [bucket, paths] of Array.from(byBucket.entries())) {
    const { error } = await admin.storage.from(bucket).remove(Array.from(paths));
    if (error) {
      console.error(`[property-editor] No se pudieron borrar archivos de ${bucket}:`, error.message);
    }
  }
}

export async function saveFloorPlan(propertyId: string, floorPlanUrl: string) {
  if (!floorPlanUrl) {
    throw new Error("La URL del plano es obligatoria");
  }
  if (!isOwnedStorageUrl(floorPlanUrl, "floor-plans", propertyId)) {
    throw new Error("El archivo del plano no es válido. Vuelve a subirlo.");
  }

  const { supabase } = await getAuthenticatedProperty(propertyId);

  const { data: current } = await supabase
    .from("properties")
    .select("floor_plan_url")
    .eq("id", propertyId)
    .maybeSingle();

  const { error } = await supabase
    .from("properties")
    .update({ floor_plan_url: floorPlanUrl })
    .eq("id", propertyId);

  if (error) {
    throw new Error(error.message);
  }

  if (current?.floor_plan_url && current.floor_plan_url !== floorPlanUrl) {
    await removeStorageFiles(propertyId, [current.floor_plan_url]);
  }

  revalidatePath(`/properties/${propertyId}/editor`);
}

export async function createPropertyZone(
  propertyId: string,
  zone: {
    name: string;
    roomOrder: number;
    points: number[];
  },
) {
  const { supabase } = await getAuthenticatedProperty(propertyId);
  const { data, error } = await supabase
    .from("property_zones")
    .insert({
      property_id: propertyId,
      name: zone.name,
      room_order: zone.roomOrder,
      points: zone.points,
    })
    .select("id, property_id, name, room_order, points")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/properties/${propertyId}/editor`);
  return data;
}

export async function updatePropertyZone(
  propertyId: string,
  zoneId: string,
  updates: {
    name?: string;
    roomOrder?: number;
    points?: number[];
  },
) {
  const { supabase } = await getAuthenticatedProperty(propertyId);
  const { data, error } = await supabase
    .from("property_zones")
    .update({
      name: updates.name,
      room_order: updates.roomOrder,
      points: updates.points,
    })
    .eq("id", zoneId)
    .eq("property_id", propertyId)
    .select("id, property_id, name, room_order, points")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/properties/${propertyId}/editor`);
  return data;
}

export async function deletePropertyZone(propertyId: string, zoneId: string) {
  const { supabase } = await getAuthenticatedProperty(propertyId);
  const { data: zone, error: zoneError } = await supabase
    .from("property_zones")
    .select("id, room_order")
    .eq("id", zoneId)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (zoneError) {
    throw new Error(zoneError.message);
  }

  if (!zone) {
    throw new Error("La habitación no pertenece a esta propiedad");
  }

  const { data: zonePhotos } = await supabase
    .from("property_zone_photos")
    .select("url")
    .eq("zone_id", zoneId);

  const { error: photosDeleteError } = await supabase
    .from("property_zone_photos")
    .delete()
    .eq("zone_id", zoneId);

  if (photosDeleteError) {
    throw new Error(photosDeleteError.message);
  }

  const { error: deleteError } = await supabase
    .from("property_zones")
    .delete()
    .eq("id", zoneId)
    .eq("property_id", propertyId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { data: remainingZones, error: remainingZonesError } = await supabase
    .from("property_zones")
    .select("id, room_order")
    .eq("property_id", propertyId)
    .order("room_order", { ascending: true });

  if (remainingZonesError) {
    throw new Error(remainingZonesError.message);
  }

  for (const [index, remainingZone] of remainingZones.entries()) {
    const { error: reorderError } = await supabase
      .from("property_zones")
      .update({ room_order: index + 1 })
      .eq("id", remainingZone.id)
      .eq("property_id", propertyId);

    if (reorderError) {
      throw new Error(reorderError.message);
    }
  }

  await removeStorageFiles(propertyId, (zonePhotos ?? []).map((photo: { url: string | null }) => photo.url));

  revalidatePath(`/properties/${propertyId}/editor`);
}

export async function savePropertyZonePhoto(
  propertyId: string,
  zoneId: string,
  photoSlot: 1 | 2,
  url: string,
) {
  if (!url || ![1, 2].includes(photoSlot)) {
    throw new Error("La foto y el slot son obligatorios");
  }
  if (!isOwnedStorageUrl(url, "property-photos", propertyId)) {
    throw new Error("El archivo de la foto no es válido. Vuelve a subirlo.");
  }

  const { supabase } = await getAuthenticatedProperty(propertyId);
  const { data: zone, error: zoneError } = await supabase
    .from("property_zones")
    .select("id")
    .eq("id", zoneId)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (zoneError) {
    throw new Error(zoneError.message);
  }

  if (!zone) {
    throw new Error("La habitación no pertenece a esta propiedad");
  }

  const { data: previous } = await supabase
    .from("property_zone_photos")
    .select("url")
    .eq("zone_id", zoneId)
    .eq("photo_slot", photoSlot)
    .maybeSingle();

  const photoPayload = {
    zone_id: zoneId,
    photo_slot: photoSlot,
    url,
  };

  const { data, error } = await supabase
    .from("property_zone_photos")
    .upsert(photoPayload, { onConflict: "zone_id,photo_slot" })
    .select("id, zone_id, photo_slot, url")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (previous?.url && previous.url !== url) {
    await removeStorageFiles(propertyId, [previous.url]);
  }

  revalidatePath(`/properties/${propertyId}/editor`);
  return data;
}

export async function deletePropertyZonePhoto(
  propertyId: string,
  zoneId: string,
  photoId: string,
) {
  const { supabase } = await getAuthenticatedProperty(propertyId);

  const { data: photo } = await supabase
    .from("property_zone_photos")
    .select("url")
    .eq("id", photoId)
    .eq("zone_id", zoneId)
    .maybeSingle();

  const { error } = await supabase
    .from("property_zone_photos")
    .delete()
    .eq("id", photoId)
    .eq("zone_id", zoneId);

  if (error) {
    throw new Error(error.message);
  }

  await removeStorageFiles(propertyId, [photo?.url]);

  revalidatePath(`/properties/${propertyId}/editor`);
}
