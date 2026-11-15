import Link from "next/link";
import { updatePassword } from "@/app/actions/auth";

export default async function ResetPasswordPage({
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
        <h1 className="mb-1 text-2xl font-semibold text-white">Crea una contraseña nueva</h1>
        <p className="mb-8 text-sm text-[#94A3B8]">Usa al menos 8 caracteres.</p>

        <form action={updatePassword} className="space-y-5">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm text-[#94A3B8]">
              Contraseña nueva
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-[#475569] transition-all duration-200 focus:border-[#D4AF37]/60 focus:bg-white/8 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm text-[#94A3B8]">
              Repite la contraseña
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-[#475569] transition-all duration-200 focus:border-[#D4AF37]/60 focus:bg-white/8 focus:outline-none"
              placeholder="••••••••"
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
            Guardar contraseña
          </button>
        </form>
      </div>
    </main>
  );
}
