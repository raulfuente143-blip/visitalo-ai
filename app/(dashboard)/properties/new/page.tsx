import { createProperty } from "@/app/actions/properties";
import { createServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, PageHeader, buttonStyles, inputStyles, labelStyles } from "@/components/panel-ui";

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
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Nueva propiedad"
        description="Después podrás subir el plano y las fotos de cada habitación."
        action={
          <a href="/properties" className={`${buttonStyles.secondary} w-full sm:w-auto`}>
            Volver
          </a>
        }
      />

      <Card>
        <form action={createProperty} className="space-y-6">
          <div>
            <label htmlFor="address" className={labelStyles}>
              Dirección
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              required
              placeholder="Calle, número, ciudad, provincia"
              className={inputStyles}
            />
          </div>

          <div>
            <label htmlFor="internalReference" className={labelStyles}>
              Referencia interna
            </label>
            <input
              id="internalReference"
              name="internalReference"
              type="text"
              placeholder="Ej: V-204"
              className={inputStyles}
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          <div className="flex sm:justify-end">
            <button type="submit" className={`${buttonStyles.primary} w-full sm:w-auto`}>
              Guardar y abrir editor
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
