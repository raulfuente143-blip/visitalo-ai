"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";

async function getAuthenticatedProperty(propertyId: string) {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("agency_id", membership.agency_id)
    .maybeSingle();

  if (!property) {
    redirect("/properties");
  }

  return { supabase, user, property };
}

export async function saveFloorPlan(propertyId: string, floorPlanUrl: string) {
  if (!floorPlanUrl) {
    throw new Error("La URL del plano es obligatoria");
  }

  const { supabase } = await getAuthenticatedProperty(propertyId);
  const { error } = await supabase
    .from("properties")
    .update({ floor_plan_url: floorPlanUrl })
    .eq("id", propertyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/properties/${propertyId}/editor`);
}

export async function createPropertyZone(
  propertyId: string,
  zone: {
    name: string;
    roomOrder: number;
    x: number;
    y: number;
  },
) {
  const { supabase } = await getAuthenticatedProperty(propertyId);
  const { data, error } = await supabase
    .from("property_zones")
    .insert({
      property_id: propertyId,
      name: zone.name,
      room_order: zone.roomOrder,
      x: zone.x,
      y: zone.y,
      width: 9,
      height: 7,
    })
    .select("id, name, room_order, x, y, width, height")
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
    name: string;
    roomOrder: number;
  },
) {
  const { supabase } = await getAuthenticatedProperty(propertyId);
  const { data, error } = await supabase
    .from("property_zones")
    .update({
      name: updates.name,
      room_order: updates.roomOrder,
    })
    .eq("id", zoneId)
    .eq("property_id", propertyId)
    .select("id, name, room_order, x, y, width, height")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/properties/${propertyId}/editor`);
  return data;
}

export async function deletePropertyZone(propertyId: string, zoneId: string) {
  const { supabase } = await getAuthenticatedProperty(propertyId);
  const { error } = await supabase
    .from("property_zones")
    .delete()
    .eq("id", zoneId)
    .eq("property_id", propertyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/properties/${propertyId}/editor`);
}
