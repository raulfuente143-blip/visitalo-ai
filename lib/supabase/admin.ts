import { createClient } from "@supabase/supabase-js";

// Cliente con la clave de servicio. Ignora las reglas RLS.
// SOLO para código de servidor que no tiene sesión de usuario (webhook de Stripe).
// Nunca lo importes en un componente "use client".
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
