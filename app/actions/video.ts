"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";

export type CreateVideoResult =
  | { ok: true; videoId: string }
  | { ok: false; error: string; reason?: "limit" | "rooms" };

type UsageRow = {
  plan_code: string;
  is_trial: boolean;
  video_limit: number;
  videos_used: number;
  max_rooms: number;
};

type ConsumeRow = {
  allowed: boolean;
  videos_used: number;
  video_limit: number;
  is_trial: boolean;
};

function firstRow<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T) ?? null;
  return (data as T) ?? null;
}

export async function createVideo(propertyId: string): Promise<CreateVideoResult> {
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
    .select("id, agency_id")
    .eq("id", propertyId)
    .maybeSingle();

  if (propertyError) {
    return { ok: false, error: "No se ha podido cargar la propiedad. Inténtalo de nuevo." };
  }

  if (!property) {
    redirect("/properties");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .eq("agency_id", property.agency_id)
    .maybeSingle();

  if (membershipError) {
    return { ok: false, error: "No se ha podido comprobar tu acceso. Inténtalo de nuevo." };
  }

  if (!membership) {
    redirect("/properties");
  }

  const { data: usageData, error: usageError } = await supabase.rpc("get_agency_usage", {
    p_agency_id: property.agency_id,
  });
  const usage = firstRow<UsageRow>(usageData);

  if (usageError || !usage) {
    return { ok: false, error: "No se ha podido comprobar tu plan. Inténtalo de nuevo." };
  }

  const { count: roomCount, error: roomsError } = await supabase
    .from("property_zones")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);

  if (roomsError) {
    return { ok: false, error: "No se han podido comprobar las habitaciones. Inténtalo de nuevo." };
  }

  const rooms = roomCount ?? 0;

  if (rooms === 0) {
    return { ok: false, error: "Define al menos una habitación en el editor antes de generar el video." };
  }

  if (rooms > usage.max_rooms) {
    return {
      ok: false,
      reason: "rooms",
      error:
        `Esta propiedad tiene ${rooms} habitaciones y tu plan permite hasta ${usage.max_rooms} por video.` +
        (usage.plan_code !== "pro" ? " Con el plan Pro puedes llegar a 10." : ""),
    };
  }

  const { data: consumeData, error: consumeError } = await supabase.rpc("consume_video_credit", {
    p_agency_id: property.agency_id,
  });
  const consume = firstRow<ConsumeRow>(consumeData);

  if (consumeError || !consume) {
    return { ok: false, error: "No se ha podido comprobar tu consumo. Inténtalo de nuevo." };
  }

  if (!consume.allowed) {
    return {
      ok: false,
      reason: "limit",
      error: consume.is_trial
        ? `Has usado los ${consume.video_limit} videos de la prueba gratuita. Elige un plan para seguir creando videos.`
        : `Has usado los ${consume.video_limit} videos de tu plan en este periodo. Podrás crear más cuando se renueve, o cambiar a un plan superior.`,
    };
  }

  const { data: video, error: videoError } = await supabase
    .from("videos")
    .insert({
      property_id: propertyId,
      agency_id: property.agency_id,
      status: "pending",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (videoError || !video) {
    return { ok: false, error: "No se ha podido crear el video. Inténtalo de nuevo." };
  }

  const { error: jobError } = await supabase.from("video_jobs").insert({
    video_id: video.id,
    job_type: "render",
    status: "pending",
  });

  if (jobError) {
    return { ok: false, error: "No se ha podido preparar el video. Inténtalo de nuevo." };
  }

  revalidatePath(`/properties/${propertyId}/video`);
  revalidatePath(`/videos/${video.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/billing");
  return { ok: true, videoId: video.id };
}

export async function deleteVideo(videoId: string) {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("videos").delete().eq("id", videoId);
  revalidatePath("/videos");
}

export async function failVideoAndRefund(
  videoId: string,
  message: string,
): Promise<{ refunded: boolean }> {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { refunded: false };
  }

  await supabase
    .from("videos")
    .update({ status: "failed", error_message: message.slice(0, 500) })
    .eq("id", videoId)
    .neq("status", "completed");

  const { data, error } = await supabase.rpc("refund_failed_video_credit", { p_video_id: videoId });

  revalidatePath("/dashboard");
  revalidatePath("/billing");
  return { refunded: !error && data === true };
}
