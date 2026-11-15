"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/server";
import {
  LAST_ACTIVE_COOKIE,
  SHORT_SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/session-policy";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

// Traduce los errores de Supabase Auth al español.
function translateAuthError(message: string) {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) return "Email o contraseña incorrectos.";
  if (text.includes("email not confirmed")) return "Confirma tu email antes de entrar.";
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "Ya existe una cuenta con este email.";
  }
  if (text.includes("should be different")) return "La nueva contraseña debe ser distinta de la anterior.";
  if (text.includes("password should be at least") || text.includes("weak")) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (text.includes("rate limit") || text.includes("too many")) {
    return "Demasiados intentos. Espera unos minutos y vuelve a probar.";
  }
  return "No se ha podido completar la acción. Inténtalo de nuevo.";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "agencia";
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/register?error=Rellena+todos+los+campos");
  }

  const supabase = await createServerComponentClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(translateAuthError(error.message))}`);
  }

  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  if (!email || !password) {
    redirect("/login?error=Rellena+todos+los+campos");
  }

  const supabase = await createServerComponentClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(translateAuthError(error.message))}`);
  }

  const cookieStore = await cookies();
  if (remember) {
    cookieStore.delete(SHORT_SESSION_COOKIE);
    cookieStore.delete(LAST_ACTIVE_COOKIE);
  } else {
    cookieStore.set(SHORT_SESSION_COOKIE, "1", sessionCookieOptions);
    cookieStore.set(LAST_ACTIVE_COOKIE, String(Date.now()), sessionCookieOptions);
  }

  redirect("/dashboard");
}

export async function completeOnboarding(formData: FormData) {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const name = String(formData.get("agencyName") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const primaryColor = String(formData.get("primaryColor") ?? "#0F172A").trim();
  const secondaryColor = String(formData.get("secondaryColor") ?? "#F59E0B").trim();

  if (!name) {
    redirect("/onboarding?error=El+nombre+de+la+agencia+es+obligatorio");
  }

  let slug = slugify(name);
  const { data: existingAgency } = await supabase
    .from("agencies")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingAgency) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 8)}`;
  }

  const rpcPayload = {
    p_name: name,
    p_slug: slug,
    p_logo_url: logoUrl || null,
    p_primary_color: primaryColor || "#0F172A",
    p_secondary_color: secondaryColor || "#F59E0B",
  };

  const { data: agencyId, error: agencyError } = await supabase.rpc("create_agency_for_user", rpcPayload);

  if (agencyError || !agencyId) {
    redirect(`/onboarding?error=${encodeURIComponent(agencyError?.message ?? "No+se+puedo+crear+la+agencia")}`);
  }

  redirect("/dashboard");
}

export async function saveAgencyProfile(formData: FormData) {
  console.log("[saveAgencyProfile] formData:", {
    agencyName: formData.get("agencyName"),
    logoUrl: formData.get("logoUrl"),
    primaryColor: formData.get("primaryColor"),
  });

  const supabase = await createServerComponentClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log("[saveAgencyProfile] Sin sesión:", userError?.message);
    redirect("/login");
  }

  const name = String(formData.get("agencyName") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const primaryColor = String(formData.get("primaryColor") ?? "#0F172A").trim();
  const secondaryColor = String(formData.get("secondaryColor") ?? "#F59E0B").trim();

  if (!name) {
    redirect("/settings?error=El+nombre+de+la+agencia+es+obligatorio");
  }

  const { data: existingMembership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMembership?.agency_id) {
    const { data: existingAgency } = await supabase
      .from("agencies")
      .select("id")
      .eq("id", existingMembership.agency_id)
      .maybeSingle();

    if (!existingAgency) {
      let slug = slugify(name);
      const { data: duplicateAgency } = await supabase
        .from("agencies")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (duplicateAgency) {
        slug = `${slug}-${Math.random().toString(36).slice(2, 8)}`;
      }

      const rpcPayload = {
        p_name: name,
        p_slug: slug,
        p_logo_url: logoUrl || null,
        p_primary_color: primaryColor || "#0F172A",
        p_secondary_color: secondaryColor || "#F59E0B",
      };

      const { data: agencyId, error: agencyError } = await supabase.rpc("create_agency_for_user", rpcPayload);

      if (agencyError || !agencyId) {
        redirect(`/settings?error=${encodeURIComponent(agencyError?.message ?? "No+se+puedo+crear+la+agencia")}`);
      }

      revalidatePath("/dashboard");
      revalidatePath("/settings");
      redirect("/settings?saved=true");
    }

    const { error } = await supabase
      .from("agencies")
      .update({
        name,
        logo_url: logoUrl || null,
        brand_primary_color: primaryColor || "#0F172A",
        brand_secondary_color: secondaryColor || "#F59E0B",
      })
      .eq("id", existingMembership.agency_id);

    if (error) {
      redirect(`/settings?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/dashboard");
    revalidatePath("/settings");
    console.log("[saveAgencyProfile] Update exitoso, logo guardado:", logoUrl);
    console.log("[saveAgencyProfile] Redirigiendo a personalización...");
    redirect("/settings?saved=true");
  }

  let slug = slugify(name);
  const { data: existingAgency } = await supabase
    .from("agencies")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingAgency) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 8)}`;
  }

  const rpcPayload = {
    p_name: name,
    p_slug: slug,
    p_logo_url: logoUrl || null,
    p_primary_color: primaryColor || "#0F172A",
    p_secondary_color: secondaryColor || "#F59E0B",
  };

  const { data: agencyId, error: agencyError } = await supabase.rpc("create_agency_for_user", rpcPayload);

  if (agencyError || !agencyId) {
    redirect(`/settings?error=${encodeURIComponent(agencyError?.message ?? "No+se+puedo+crear+la+agencia")}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  redirect("/settings?saved=true");
}

export async function updateUserProfile(formData: FormData): Promise<{ success: boolean; message: string }> {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "Tu sesión ha expirado. Inicia sesión de nuevo." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/account");
  return { success: true, message: "Cambios guardados correctamente." };
}

export async function sendPasswordReset(): Promise<{ success: boolean; message: string }> {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return { success: false, message: "No se encontró el email de la cuenta." };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${appUrl()}/auth/confirm?next=/reset-password`,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: "Email enviado. Revisa tu bandeja de entrada." };
}

export async function signOut() {
  const supabase = await createServerComponentClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(SHORT_SESSION_COOKIE);
  cookieStore.delete(LAST_ACTIVE_COOKIE);
  redirect("/login");
}

// Recuperar contraseña desde el inicio de sesión.
// Por privacidad, siempre responde igual exista o no la cuenta.
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/forgot-password?error=Escribe+tu+email");
  }

  const supabase = await createServerComponentClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl()}/auth/confirm?next=/reset-password`,
  });

  if (error && (error.status === 429 || error.message.toLowerCase().includes("rate limit"))) {
    redirect(`/forgot-password?error=${encodeURIComponent(translateAuthError(error.message))}`);
  }

  redirect("/forgot-password?sent=1");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    redirect("/reset-password?error=La+contrase%C3%B1a+debe+tener+al+menos+8+caracteres");
  }

  if (password !== confirm) {
    redirect("/reset-password?error=Las+contrase%C3%B1as+no+coinciden");
  }

  const supabase = await createServerComponentClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(translateAuthError(error.message))}`);
  }

  redirect("/dashboard");
}
