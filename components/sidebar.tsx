"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Inicio", href: "/dashboard", icon: "home" },
  { label: "Propiedades", href: "/properties", icon: "building" },
  { label: "Videos", href: "/videos", icon: "play" },
] as const;

const secondaryNavigation = [
  { label: "Personalizar", href: "/settings", icon: "personalize" },
  { label: "Ajustes", href: "/account", icon: "settings" },
] as const;

const allNavigation = [...navigation, ...secondaryNavigation];

function NavigationIcon({ name }: { name: (typeof allNavigation)[number]["icon"] }) {
  const commonProps = {
    className: "h-5 w-5 shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
  };

  if (name === "home") {
    return (
      <svg {...commonProps}>
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
      </svg>
    );
  }

  if (name === "building") {
    return (
      <svg {...commonProps}>
        <path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16M2 21h20M8 7h2m3 0h1M8 11h2m3 0h1M8 15h2m3 0h1m3-4h2m-2 4h2" />
      </svg>
    );
  }

  if (name === "play") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="m10 8 6 4-6 4z" />
      </svg>
    );
  }

  if (name === "personalize") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
        />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      <path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" />
    </svg>
  );
}

function NavigationLinkList({
  items,
  mobile = false,
}: {
  items: readonly (typeof allNavigation)[number][];
  mobile?: boolean;
}) {
  const pathname = usePathname();

  return items.map((item) => {
      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={mobile
              ? `flex flex-col items-center gap-1 px-1 py-3 text-[11px] transition-colors duration-150 ${isActive ? "text-white" : "text-[#9CA3AF]"}`
              : isActive
                ? "flex items-center gap-3 mx-3 px-4 py-2.5 text-sm font-medium rounded-xl bg-white/10 text-white border border-white/10 backdrop-blur-sm"
                : "flex items-center gap-3 mx-3 px-4 py-2.5 text-sm font-medium rounded-xl text-[#9CA3AF] hover:bg-white/5 hover:text-white transition-all duration-150"}
          >
            <NavigationIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        );
      });
}

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <nav className="grid grid-cols-5" aria-label="Navegación principal">
        <NavigationLinkList items={allNavigation} mobile />
      </nav>
    );
  }

  return (
    <nav aria-label="Navegación principal">
      <div className="space-y-1 px-3">
        <NavigationLinkList items={navigation} />
      </div>
    </nav>
  );
}

export function Sidebar({ email }: { email: string }) {
  return (
    <>
      <aside className="hidden md:flex min-h-screen w-[240px] shrink-0 flex-col bg-gradient-to-b from-[#0F172A] to-[#1a1f2e] border-r border-white/5 shadow-2xl fixed top-0 left-0 h-screen z-40 overflow-y-auto">
        <div className="px-6 py-7">
          <span className="text-2xl font-bold tracking-tight text-white">Visitalo</span>
          <span className="text-2xl font-bold tracking-tight text-[#D4AF37]">.ai</span>
        </div>
        <div className="mt-3 flex flex-1 flex-col">
          <NavigationLinks />
          <div className="flex-1" />
          <div className="mx-6 my-2 border-t border-white/10" />
          <div className="pb-3">
            <nav aria-label="Ajustes">
              <div className="space-y-1 px-3">
                <NavigationLinkList items={secondaryNavigation} />
              </div>
            </nav>
          </div>
          <div className="p-4 border-t border-white/10">
            <span className="text-xs text-[#6B7280] truncate block">{email}</span>
          </div>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-50 bg-[#111827] md:hidden">
        <NavigationLinks mobile />
      </div>
    </>
  );
}