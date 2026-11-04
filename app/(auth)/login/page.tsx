import Link from "next/link";
import { signIn } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const error = params.error ? decodeURIComponent(params.error) : "";

  return (
    <main className="flex min-h-svh items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#1a1f2e] to-[#0F172A] px-4 py-10">
      <div className="glass-surface page-enter w-full max-w-md rounded-3xl p-7 sm:p-10">
        <Link href="/" className="mb-8 block text-center text-2xl font-bold tracking-tight">
          <span className="text-white">Visitalo</span><span className="text-[#D4AF37]">.ai</span>
        </Link>
        <h1 className="page-enter mb-1 text-2xl font-semibold text-white">Inicia sesión</h1>
        <p className="page-enter-delay-1 mb-8 text-sm text-[#94A3B8]">Accede a tu cuenta de Visitalo.ai</p>

        <form action={signIn} className="space-y-5">
          <div className="page-enter-delay-2">
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

          <div className="page-enter-delay-2">
            <label htmlFor="password" className="mb-1.5 block text-sm text-[#94A3B8]">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-[#475569] transition-all duration-200 focus:border-[#D4AF37]/60 focus:bg-white/8 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-[#D4AF37] py-3.5 font-bold text-[#0F172A] transition-all duration-200 hover:bg-[#B8960C] active:scale-[0.98]"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#64748B]">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="text-[#D4AF37] hover:text-[#B8960C]">
            Regístrate
          </a>
        </p>
      </div>
    </main>
  );
}
