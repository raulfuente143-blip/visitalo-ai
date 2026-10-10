"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";

export async function createVideo(propertyId: string) {
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
    throw new Error(propertyError.message);
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
    throw new Error(membershipError.message);
  }

  if (!membership) {
    redirect("/properties");
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

  if (videoError) {
    throw new Error(videoError.message);
  }

  const { error: jobError } = await supabase.from("video_jobs").insert({
    video_id: video.id,
    job_type: "render",
    status: "pending",
  });

  if (jobError) {
    throw new Error(jobError.message);
  }

  revalidatePath(`/properties/${propertyId}/video`);
  revalidatePath(`/videos/${video.id}`);
  return video.id;
}

export async function deleteVideo(videoId: string) {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("videos").delete().eq("id", videoId);
  revalidatePath("/videos");
}

export async function deleteAllVideos() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) return;

  await supabase.from("videos").delete().eq("agency_id", membership.agency_id);
  revalidatePath("/videos");
}
