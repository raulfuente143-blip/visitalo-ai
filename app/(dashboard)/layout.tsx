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
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <Sidebar email={user.email ?? ""} />
      <main className="flex-1 overflow-auto p-8 pb-24 md:pb-8">{children}</main>
    </div>
  );
}