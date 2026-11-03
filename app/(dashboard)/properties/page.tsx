import { createServerComponentClient } from "@/lib/supabase/server";
import { DeletePropertyButton } from "@/components/delete-property-button";
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
    <div className="mx-auto max-w-6xl text-[#111827]">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Propiedades</h1>
          </div>

          <a
            href="/properties/new"
            className="rounded-full bg-[#D4AF37] px-4 py-2.5 text-sm font-medium text-[#111827] shadow-md transition-all duration-150 hover:shadow-lg active:scale-[0.97]"
          >
            Nueva propiedad
          </a>
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-md">
          {properties && properties.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-[#6B7280]">Nombre</th>
                    <th className="px-4 py-3 font-semibold text-[#6B7280]">Dirección</th>
                    <th className="px-4 py-3 font-semibold text-[#6B7280]">Referencia</th>
                    <th className="px-4 py-3 font-semibold text-[#6B7280]">Estado</th>
                    <th className="px-4 py-3 font-semibold text-[#6B7280]">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property) => (
                    <tr key={property.id} className="border-b border-[#F3F4F6] transition-colors duration-150 hover:bg-slate-50">
                      <td className="px-4 py-4 font-medium text-[#111827]">
                        <a href={`/properties/${property.id}/editor`} className="hover:underline">
                          {property.name}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-[#6B7280]">{property.address}</td>
                      <td className="px-4 py-4 text-[#6B7280]">
                        {property.internal_reference ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[property.status] ?? statusStyles.draft}`}
                        >
                          {property.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/properties/${property.id}/editor`}
                            className="inline-flex rounded-xl bg-[#111827] px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#1F2937]"
                          >
                            Abrir editor
                          </a>
                          <a
                            href={`/properties/${property.id}/video`}
                            className="inline-flex rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm font-semibold text-[#111827] transition-all duration-200 hover:bg-[#F9FAFB]"
                          >
                            Crear video
                          </a>
                          <DeletePropertyButton propertyId={property.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center">
              <p className="text-lg font-semibold text-[#111827]">Todavía no hay propiedades</p>
              <p className="mt-2 text-sm text-[#6B7280]">
                Crea tu primera propiedad para empezar a preparar el plano de la vivienda.
              </p>
              <a
                href="/properties/new"
                className="mt-5 inline-block rounded-full bg-[#D4AF37] px-4 py-2.5 text-sm font-medium text-[#111827] transition-all duration-200 hover:brightness-95"
              >
                Crear primera propiedad
              </a>
            </div>
          )}
        </section>
    </div>
  );
}
