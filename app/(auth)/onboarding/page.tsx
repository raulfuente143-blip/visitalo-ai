import { Suspense } from "react";
import { OnboardingLogoUploader } from "@/components/onboarding-logo-uploader";
import { completeOnboarding } from "@/app/actions/auth";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const error = params.error ? decodeURIComponent(params.error) : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">
            Onboarding
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Configura tu agencia</h1>
          <p className="mt-2 text-slate-600">
            Añade los datos básicos de tu marca para empezar a trabajar con Visitalo.ai.
          </p>
        </div>

        <form action={completeOnboarding} className="space-y-6">
          <div>
            <label htmlFor="agencyName" className="mb-2 block text-sm font-medium text-slate-700">
              Nombre de la agencia
            </label>
            <input
              id="agencyName"
              name="agencyName"
              type="text"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none ring-0 transition focus:border-sky-500 focus:bg-white"
              placeholder="Tu agencia inmobiliaria"
            />
          </div>

          <Suspense fallback={<div className="text-sm text-slate-500">Preparando uploader…</div>}>
            <OnboardingLogoUploader />
          </Suspense>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="primaryColor" className="mb-2 block text-sm font-medium text-slate-700">
                Color principal
              </label>
              <input
                id="primaryColor"
                name="primaryColor"
                type="color"
                defaultValue="#0F172A"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 p-1"
              />
            </div>

            <div>
              <label htmlFor="secondaryColor" className="mb-2 block text-sm font-medium text-slate-700">
                Color secundario
              </label>
              <input
                id="secondaryColor"
                name="secondaryColor"
                type="color"
                defaultValue="#F59E0B"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 p-1"
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800"
          >
            Guardar agencia
          </button>
        </form>
      </div>
    </main>
  );
}
