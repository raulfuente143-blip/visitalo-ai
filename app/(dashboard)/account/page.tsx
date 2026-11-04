import { AccountProfileForms } from "@/components/account-profile-forms";
import { createServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { Card, PageHeader } from "@/components/panel-ui";

const legalLinks = [
  { label: "Política de privacidad", href: "/legal/privacidad" },
  { label: "Política de cookies", href: "/legal/cookies" },
  { label: "Términos y condiciones", href: "/legal/terminos" },
];

export default async function AccountPage() {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Ajustes" description="Tus datos personales, la seguridad de la cuenta y la sesión." />

      <div className="space-y-5">
        <AccountProfileForms
          fullName={typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : ""}
          email={user.email ?? ""}
        />

        <Card>
          <h2 className="text-lg font-semibold text-[#0F172A]">Legal</h2>
          <p className="mt-1 text-sm text-[#6B7280]">Documentos legales y política de privacidad.</p>
          <div className="mt-4 divide-y divide-[#F1F1F1] overflow-hidden rounded-xl border border-[#E5E7EB]">
            {legalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3.5 text-sm text-[#0F172A] transition-colors hover:bg-[#F9FAFB]"
              >
                <span>{link.label}</span>
                <span aria-hidden="true" className="text-[#9CA3AF]">
                  →
                </span>
              </a>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-[#0F172A]">Sesión</h2>
          <p className="mt-1 text-sm text-[#6B7280]">Cierra tu sesión en este dispositivo.</p>
          <form action={signOut} className="mt-4">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 sm:w-auto"
            >
              Cerrar sesión
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
