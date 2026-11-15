// Sesión corta: si el usuario NO marca "Mantener la sesión iniciada",
// la sesión se cierra tras este tiempo sin actividad.
export const SHORT_SESSION_COOKIE = "vis_short_session";
export const LAST_ACTIVE_COOKIE = "vis_last_active";
export const INACTIVITY_LIMIT_MS = 2 * 60 * 60 * 1000;

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};
