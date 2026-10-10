import { saveAgencyProfile } from "@/app/actions/auth";
import { Breadcrumb } from "@/components/breadcrumb";
import { OnboardingLogoUploader } from "@/components/onboarding-logo-uploader";
import { createServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; saved?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const error = params.error ? decodeURIComponent(params.error) : "";
  const saved = params.saved === "true";

  const supabase = await createServerComponentClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: agency } = membership?.agency_id
    ? await supabase
        .from("agencies")
        .select("id, name, logo_url, brand_primary_color")
        .eq("id", membership.agency_id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="mx-auto max-w-4xl text-[#111827]">
      <Breadcrumb items={[{ label: "Personalizar", href: "/settings" }]} />
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Personalizar tu agencia</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Actualiza el logo y color de marca de tu agencia.</p>
      </header>

      {saved ? (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          ✓ Cambios guardados correctamente
        </div>
      ) : null}

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-bold text-[#111827]">
          {agency ? "Editar perfil de la agencia" : "Configurar perfil de la agencia"}
        </h2>

        <form action={saveAgencyProfile} className="space-y-6">
          <div>
            <label htmlFor="agencyName" className="mb-2 block text-sm font-medium text-[#6B7280]">
              Nombre de la agencia
            </label>
            <input
              id="agencyName"
              name="agencyName"
              type="text"
              defaultValue={agency?.name ?? ""}
              required
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[#111827] outline-none transition focus:border-[#D4AF37]"
            />
          </div>

          <OnboardingLogoUploader initialLogoUrl={agency?.logo_url ?? undefined} />

          <div>
            <label htmlFor="brandColor" className="mb-2 block text-sm font-medium text-[#6B7280]">
              Color de marca
            </label>
            <input
              id="brandColor"
              name="primaryColor"
              type="color"
              defaultValue={agency?.brand_primary_color ?? "#0F172A"}
              className="h-12 w-full rounded-lg border border-[#E5E7EB] bg-white p-1 outline-none focus:border-[#D4AF37]"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="rounded-lg bg-[#111827] px-4 py-2 text-white transition hover:bg-[#1F2937]"
          >
            Guardar perfil
          </button>
        </form>
      </section>
    </div>
  );
}
