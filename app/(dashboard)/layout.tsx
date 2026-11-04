import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { createServerComponentClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] md:flex">
      <Sidebar email={user.email ?? ""} />
      <main className="min-w-0 flex-1 bg-[#FAFAFA] px-5 pt-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] text-[#0F172A] sm:px-6 md:ml-[240px] md:px-10 md:pt-10 md:pb-12">
        {children}
      </main>
    </div>
  );
}
