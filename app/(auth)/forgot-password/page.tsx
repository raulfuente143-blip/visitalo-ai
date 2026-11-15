import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; sent?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const error = params.error ? decodeURIComponent(params.error) : "";
  const sent = params.sent === "1";

  return (
    <main className="flex min-h-svh items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#1a1f2e] to-[#0F172A] px-4 py-10">
      <div className="glass-surface page-enter w-full max-w-md rounded-3xl p-7 sm:p-10">
        <Link href="/" className="mb-8 block text-center text-2xl font-bold tracking-tight">
          <span className="text-white">Visitalo</span><span className="text-[#D4AF37]">.ai</span>
        </Link>
        <h1 className="mb-1 text-2xl font-semibold text-white">Recupera tu contraseña</h1>
        <p className="mb-8 text-sm text-[#94A3B8]">
          Escribe el email de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.
        </p>

        {sent ? (
          <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-4 text-sm text-[#F1E3A6]" role="status">
            <p className="font-semibold text-white">Revisa tu correo</p>
            <p className="mt-1">
              Si el email que has escrito tiene una cuenta en Visitalo.ai, te hemos enviado un enlace para crear una contraseña nueva. Puede tardar unos minutos; mira también en spam.
            </p>
            <Link href="/forgot-password" className="mt-3 inline-block font-medium text-[#D4AF37] hover:text-[#B8960C]">
              ¿No te llega? Revisa el email y prueba de nuevo
            </Link>
          </div>
        ) : (
          <form action={requestPasswordReset} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm text-[#94A3B8]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-[#475569] transition-all duration-200 focus:border-[#D4AF37]/60 focus:bg-white/8 focus:outline-none"
                placeholder="hola@agencia.com"
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-[#D4AF37] py-3.5 font-bold text-[#0F172A] transition-all duration-200 hover:bg-[#B8960C] active:scale-[0.98]"
            >
              Enviar enlace
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[#64748B]">
          <Link href="/login" className="text-[#D4AF37] hover:text-[#B8960C]">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
