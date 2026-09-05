"use server";

import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";

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
