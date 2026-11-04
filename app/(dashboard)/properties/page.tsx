import { createServerComponentClient } from "@/lib/supabase/server";
import { DeletePropertyButton } from "@/components/delete-property-button";
import { redirect } from "next/navigation";
import { PageHeader, buttonStyles } from "@/components/panel-ui";

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-amber-100 text-amber-700",
  archived: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  active: "Activa",
  inactive: "Inactiva",
  archived: "Archivada",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status] ?? statusStyles.draft}`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

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
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Propiedades"
        description="Cada propiedad tiene su plano, sus habitaciones y sus fotos."
        action={
          <a href="/properties/new" className={`${buttonStyles.primary} w-full sm:w-auto`}>
            Nueva propiedad
          </a>
        }
      />

      <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        {properties && properties.length > 0 ? (
          <>
            <ul className="divide-y divide-[#F1F1F1] md:hidden">
              {properties.map((property) => (
                <li key={property.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <a
                        href={`/properties/${property.id}/editor`}
                        className="block truncate font-medium text-[#0F172A]"
                      >
                        {property.name}
                      </a>
                      <p className="mt-0.5 line-clamp-2 text-sm text-[#6B7280]">{property.address}</p>
                      {property.internal_reference ? (
                        <p className="mt-1 text-xs text-[#9CA3AF]">Ref. {property.internal_reference}</p>
                      ) : null}
                    </div>
                    <StatusBadge status={property.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <a href={`/properties/${property.id}/editor`} className={`${buttonStyles.dark} flex-1`}>
                      Abrir editor
                    </a>
                    <a href={`/properties/${property.id}/video`} className={`${buttonStyles.secondary} flex-1`}>
                      Crear video
                    </a>
                    <DeletePropertyButton propertyId={property.id} />
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#F1F1F1] bg-[#FAFAFA]">
                  <tr>
                    <th className="px-5 py-3 font-medium text-[#6B7280]">Nombre</th>
                    <th className="px-5 py-3 font-medium text-[#6B7280]">Dirección</th>
                    <th className="px-5 py-3 font-medium text-[#6B7280]">Referencia</th>
                    <th className="px-5 py-3 font-medium text-[#6B7280]">Estado</th>
                    <th className="px-5 py-3 font-medium text-[#6B7280]">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F1F1]">
                  {properties.map((property) => (
                    <tr key={property.id} className="transition-colors duration-150 hover:bg-[#FAFAFA]">
                      <td className="px-5 py-4 font-medium text-[#0F172A]">
                        <a href={`/properties/${property.id}/editor`} className="hover:underline">
                          {property.name}
                        </a>
                      </td>
                      <td className="px-5 py-4 text-[#6B7280]">{property.address}</td>
                      <td className="px-5 py-4 text-[#6B7280]">{property.internal_reference ?? "—"}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={property.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <a href={`/properties/${property.id}/editor`} className={buttonStyles.dark}>
                            Abrir editor
                          </a>
                          <a href={`/properties/${property.id}/video`} className={buttonStyles.secondary}>
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
          </>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-lg font-semibold text-[#0F172A]">Todavía no hay propiedades</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-pretty text-[#6B7280]">
              Crea tu primera propiedad para empezar a preparar el plano de la vivienda.
            </p>
            <a href="/properties/new" className={`${buttonStyles.primary} mt-6`}>
              Crear primera propiedad
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
