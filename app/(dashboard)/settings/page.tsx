import { saveAgencyProfile } from "@/app/actions/auth";
import { OnboardingLogoUploader } from "@/components/onboarding-logo-uploader";
import { createServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, PageHeader, buttonStyles, inputStyles, labelStyles } from "@/components/panel-ui";

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
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Personalizar"
        description="El nombre, el logo y el color de marca que aparecen en tus videos."
      />

      {saved ? (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          ✓ Cambios guardados correctamente
        </div>
      ) : null}

      <Card>
        <h2 className="mb-5 text-lg font-semibold text-[#0F172A]">
          {agency ? "Perfil de la agencia" : "Configura el perfil de la agencia"}
        </h2>

        <form action={saveAgencyProfile} className="space-y-6">
          <div>
            <label htmlFor="agencyName" className={labelStyles}>
              Nombre de la agencia
            </label>
            <input
              id="agencyName"
              name="agencyName"
              type="text"
              defaultValue={agency?.name ?? ""}
              required
              className={inputStyles}
            />
          </div>

          <OnboardingLogoUploader initialLogoUrl={agency?.logo_url ?? undefined} />

          <div>
            <label htmlFor="brandColor" className={labelStyles}>
              Color de marca
            </label>
            <input
              id="brandColor"
              name="primaryColor"
              type="color"
              defaultValue={agency?.brand_primary_color ?? "#0F172A"}
              className="h-12 w-full cursor-pointer rounded-xl border border-[#E5E7EB] bg-white p-1 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30"
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          <button type="submit" className={`${buttonStyles.dark} w-full sm:w-auto`}>
            Guardar cambios
          </button>
        </form>
      </Card>
    </div>
  );
}
