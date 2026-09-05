import { createServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PropertyEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: property } = await supabase
    .from("properties")
    .select("id, name, address, internal_reference, status")
    .eq("id", id)
    .maybeSingle();

  if (!property) {
    redirect("/properties");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Editor</p>
            <h1 className="mt-2 text-3xl font-bold">{property.name}</h1>
            <p className="mt-2 text-sm text-slate-500">{property.address}</p>
          </div>
          <a
            href="/properties"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Volver a propiedades
          </a>
        </div>

        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-800">Editor de plano</p>
          <p className="mt-2 text-sm text-slate-500">
            Aquí se cargará la imagen del plano y las zonas clicables de cada habitación.
          </p>
        </section>
      </div>
    </main>
  );
}
