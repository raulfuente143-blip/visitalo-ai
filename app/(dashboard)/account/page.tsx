import { AccountProfileForms } from "@/components/account-profile-forms";
import { createServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
    <div className="mx-auto max-w-4xl text-[#111827]">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Mi cuenta</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Administra tus datos personales y opciones de seguridad.</p>
      </header>

      <AccountProfileForms
        fullName={typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : ""}
        email={user.email ?? ""}
      />

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-md">
        <h2 className="mb-1 text-lg font-semibold text-[#111827]">Legal</h2>
        <p className="mb-4 text-sm text-[#6B7280]">Documentos legales y política de privacidad.</p>
        <div className="space-y-3">
          <a href="/legal/privacidad" target="_blank" className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-3 transition-all duration-200 hover:bg-[#F9FAFB]">
            <span className="text-sm text-[#111827]">Política de privacidad</span>
            <span className="text-[#9CA3AF]">→</span>
          </a>
          <a href="/legal/cookies" target="_blank" className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-3 transition-all duration-200 hover:bg-[#F9FAFB]">
            <span className="text-sm text-[#111827]">Política de cookies</span>
            <span className="text-[#9CA3AF]">→</span>
          </a>
          <a href="/legal/terminos" target="_blank" className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-3 transition-all duration-200 hover:bg-[#F9FAFB]">
            <span className="text-sm text-[#111827]">Términos y condiciones</span>
            <span className="text-[#9CA3AF]">→</span>
          </a>
        </div>
      </section>
    </div>
  );
}
