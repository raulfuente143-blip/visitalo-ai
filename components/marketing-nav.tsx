"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { label: "Quiénes somos", href: "/quienes-somos" },
  { label: "Casos de uso", href: "/casos-uso" },
  { label: "Planes", href: "/planes" },
];

export function MarketingNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-16 py-5 border-b border-white/5"
      style={{
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Link href="/" className="text-xl font-bold tracking-tight text-white">
        Visitalo<span className="text-[#D4AF37]">.ai</span>
      </Link>
      <div className="flex items-center gap-4 md:gap-8">
        {sections.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative hidden md:inline text-sm transition-colors duration-200 ${
                isActive ? "text-white" : "text-[#9CA3AF] hover:text-white"
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute -bottom-2 left-0 right-0 h-[2px] rounded-full bg-[#D4AF37]" />
              )}
            </Link>
          );
        })}
        <Link href="/login" className="text-sm text-[#9CA3AF] hover:text-white transition-colors">
          Iniciar sesión
        </Link>
        <Link
          href="/register"
          className="bg-[#D4AF37] text-[#0F172A] font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#B8960C] transition-all shadow-lg"
        >
          Empieza gratis
        </Link>
      </div>
    </nav>
  );
}
