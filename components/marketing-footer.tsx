import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="flex items-center justify-between border-t border-white/5 bg-[#0a0f1a] px-6 py-6 md:px-16">
      <span className="text-lg font-bold tracking-tight text-white">
        Visitalo<span className="text-[#D4AF37]">.ai</span>
      </span>
      <div className="flex items-center gap-4 text-xs text-[#64748B] sm:gap-6 md:text-sm">
        <Link href="/legal/privacidad" className="transition-colors hover:text-white">Privacidad</Link>
        <Link href="/legal/cookies" className="transition-colors hover:text-white">Cookies</Link>
        <Link href="/legal/terminos" className="transition-colors hover:text-white">Términos</Link>
      </div>
    </footer>
  );
}
