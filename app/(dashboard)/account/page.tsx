import { AccountProfileForms } from "@/components/account-profile-forms";
import { Breadcrumb } from "@/components/breadcrumb";
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
      <Breadcrumb items={[{ label: "Cuenta", href: "/account" }]} />
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Mi cuenta</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Administra tus datos personales y opciones de seguridad.</p>
      </header>

      <AccountProfileForms
        fullName={typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : ""}
        email={user.email ?? ""}
      />
    </div>
  );
}
