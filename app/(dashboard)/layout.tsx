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
      <main className="ml-0 flex-1 min-h-screen overflow-auto bg-[#FAFAFA] p-8 pb-24 md:ml-[240px] md:pb-8">{children}</main>
    </div>
  );
}