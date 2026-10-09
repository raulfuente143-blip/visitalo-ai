"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: "home" },
  { label: "Propiedades", href: "/properties", icon: "building" },
  { label: "Videos", href: "/videos", icon: "play" },
  { label: "Cuenta", href: "/account", icon: "settings" },
] as const;

function NavigationIcon({ name }: { name: (typeof navigation)[number]["icon"] }) {
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

  return (
    <svg {...commonProps}>
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      <path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" />
    </svg>
  );
}

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={mobile ? "grid grid-cols-4" : "space-y-1 px-3"} aria-label="Navegación principal">
      {navigation.map((item) => {
        const itemPath = item.href.split("#")[0];
        const isActive = itemPath === pathname && !item.href.includes("#");

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={mobile
              ? `flex flex-col items-center gap-1 px-1 py-3 text-[11px] transition ${isActive ? "text-white" : "text-[#9CA3AF]"}`
              : `flex items-center gap-3 border-l-[3px] px-4 py-3 text-sm font-medium transition ${isActive ? "border-[#D4AF37] bg-[#1F2937] text-white" : "border-transparent text-[#9CA3AF] hover:bg-[#1F2937]"}`}
          >
            <NavigationIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ email }: { email: string }) {
  return (
    <>
      <aside className="hidden min-h-screen w-[240px] shrink-0 flex-col bg-[#111827] md:flex">
        <div className="px-6 py-6 text-xl font-bold text-white">
          Visitalo<span className="text-[#D4AF37]">.ai</span>
        </div>
        <div className="mt-3 flex-1">
          <NavigationLinks />
        </div>
        <div className="break-all p-4 text-xs text-[#6B7280]">{email}</div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-50 bg-[#111827] md:hidden">
        <NavigationLinks mobile />
      </div>
    </>
  );
}