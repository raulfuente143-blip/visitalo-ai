import { createProperty } from "@/app/actions/properties";
import { createServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const error = params.error ? decodeURIComponent(params.error) : "";

  const supabase = await createServerComponentClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: agencyMember } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!agencyMember?.agency_id) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Propiedades</p>
            <h1 className="mt-2 text-3xl font-bold">Nueva propiedad</h1>
          </div>
          <a
            href="/properties"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Volver
          </a>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form action={createProperty} className="space-y-6">
            <div>
              <label htmlFor="address" className="mb-2 block text-sm font-medium text-slate-700">
                Dirección
              </label>
              <textarea
                id="address"
                name="address"
                rows={4}
                required
                placeholder="Calle ..., número, ciudad, provincia"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="internalReference" className="mb-2 block text-sm font-medium text-slate-700">
                Referencia interna
              </label>
              <input
                id="internalReference"
                name="internalReference"
                type="text"
                placeholder="Ej: V-204 / Ref. Alicante"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800"
              >
                Guardar y abrir editor
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
