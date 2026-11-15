import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import {
  INACTIVITY_LIMIT_MS,
  LAST_ACTIVE_COOKIE,
  SHORT_SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/session-policy";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/properties",
  "/videos",
  "/settings",
  "/account",
  "/billing",
  "/reset-password",
];

const AUTH_PREFIXES = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  const path = request.nextUrl.pathname;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));
  const isAuthRoute = AUTH_PREFIXES.some((prefix) => path.startsWith(prefix));

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Sesión corta: si no se marcó "Mantener la sesión iniciada" y pasa el límite sin actividad, se cierra.
  if (user && request.cookies.get(SHORT_SESSION_COOKIE)?.value === "1") {
    const lastActive = Number(request.cookies.get(LAST_ACTIVE_COOKIE)?.value ?? "0");
    const expired = !lastActive || Date.now() - lastActive > INACTIVITY_LIMIT_MS;

    if (expired) {
      await supabase.auth.signOut();
      const redirect = NextResponse.redirect(new URL("/login?expired=1", request.url));
      for (const cookie of request.cookies.getAll()) {
        if (cookie.name.startsWith("sb-")) redirect.cookies.delete(cookie.name);
      }
      redirect.cookies.delete(SHORT_SESSION_COOKIE);
      redirect.cookies.delete(LAST_ACTIVE_COOKIE);
      return redirect;
    }

    response.cookies.set(LAST_ACTIVE_COOKIE, String(Date.now()), sessionCookieOptions);
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
