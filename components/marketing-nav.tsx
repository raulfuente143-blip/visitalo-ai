"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const sections = [
  { label: "Quiénes somos", href: "/quienes-somos" },
  { label: "Casos de uso", href: "/casos-uso" },
  { label: "Planes", href: "/planes" },
];

const glass = {
  background: "rgba(15, 23, 42, 0.75)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
};

export function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-white/5 px-6 py-4 md:px-16 md:py-5"
        style={{ ...glass, borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Link href="/" onClick={close} className="text-xl font-bold tracking-tight text-white">
          Visitalo<span className="text-[#D4AF37]">.ai</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {sections.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative text-sm transition-colors duration-200 ${
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
          <Link href="/login" className="text-sm text-[#9CA3AF] transition-colors hover:text-white">
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#0F172A] shadow-lg transition-all hover:bg-[#B8960C]"
          >
            Empieza gratis
          </Link>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/register"
            onClick={close}
            className={`rounded-full bg-[#D4AF37] px-4 py-2 text-[13px] font-semibold text-[#0F172A] transition-all duration-200 hover:bg-[#B8960C] ${open ? "pointer-events-none opacity-0" : "opacity-100"}`}
          >
            Empieza gratis
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="menu-movil"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white"
          >
            <span
              className={`absolute h-[1.5px] w-4 rounded-full bg-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                open ? "rotate-45" : "-translate-y-[4px]"
              }`}
            />
            <span
              className={`absolute h-[1.5px] w-4 rounded-full bg-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                open ? "-rotate-45" : "translate-y-[4px]"
              }`}
            />
          </button>
        </div>
      </nav>

      <div
        id="menu-movil"
        inert={!open}
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{
          background: "rgba(10, 15, 26, 0.94)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}
      >
        <div
          className={`flex h-full flex-col px-6 pt-28 pb-10 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            open ? "translate-y-0" : "-translate-y-3"
          }`}
        >
          <ul className="space-y-1">
            {sections.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={isActive ? "page" : undefined}
                    className={`block py-3 text-3xl font-bold tracking-tight transition-colors ${
                      isActive ? "text-[#D4AF37]" : "text-white hover:text-[#D4AF37]"
                    }`}
                    style={{ fontFamily: "var(--font-playfair), Georgia, serif", letterSpacing: "-0.02em" }}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto space-y-5">
            <Link
              href="/register"
              onClick={close}
              className="block w-full rounded-full bg-[#D4AF37] py-4 text-center text-base font-bold text-[#0F172A] transition-all hover:bg-[#B8960C]"
            >
              Crear mi primer video
            </Link>
            <p className="text-center text-sm text-[#94A3B8]">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" onClick={close} className="font-medium text-white transition-colors hover:text-[#D4AF37]">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
