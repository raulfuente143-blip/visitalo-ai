import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/server";
import { LAST_ACTIVE_COOKIE, SHORT_SESSION_COOKIE } from "@/lib/session-policy";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/dashboard";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  const supabase = await createServerComponentClient();
  let ok = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (ok) {
    // La sesión que abre el enlace es normal: se quitan restos de una sesión corta anterior.
    const cookieStore = await cookies();
    cookieStore.delete(SHORT_SESSION_COOKIE);
    cookieStore.delete(LAST_ACTIVE_COOKIE);
    return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent("El enlace no es válido o ha caducado. Pide uno nuevo.")}`, origin)
  );
}
