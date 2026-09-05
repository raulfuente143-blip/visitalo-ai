import { createServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-amber-100 text-amber-700",
  archived: "bg-red-100 text-red-700",
};

export default async function PropertiesPage() {
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

  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, address, status, internal_reference")
    .eq("agency_id", agencyMember.agency_id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Propiedades</p>
            <h1 className="mt-2 text-3xl font-bold">Listado de propiedades</h1>
          </div>

          <a
            href="/properties/new"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Nueva propiedad
          </a>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {properties && properties.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-700">Nombre</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Dirección</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Referencia</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {properties.map((property) => (
                    <tr key={property.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 font-medium text-slate-900">{property.name}</td>
                      <td className="px-4 py-4 text-slate-600">{property.address}</td>
                      <td className="px-4 py-4 text-slate-500">
                        {property.internal_reference ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[property.status] ?? statusStyles.draft}`}
                        >
                          {property.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-lg font-semibold text-slate-800">Todavía no hay propiedades</p>
              <p className="mt-2 text-sm text-slate-500">
                Crea tu primera propiedad para empezar a preparar el plano de la vivienda.
              </p>
              <a
                href="/properties/new"
                className="mt-5 inline-block rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Crear primera propiedad
              </a>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
