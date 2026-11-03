import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="bg-[#0a0f1a] border-t border-white/5 py-6 px-8 md:px-16 flex items-center justify-between">
      <span className="text-lg font-bold text-white">
        Visitalo<span className="text-[#D4AF37]">.ai</span>
      </span>
      <div className="flex gap-6 text-xs text-[#64748B]">
        <Link href="/legal/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
        <Link href="/legal/cookies" className="hover:text-white transition-colors">Cookies</Link>
        <Link href="/legal/terminos" className="hover:text-white transition-colors">Términos</Link>
      </div>
    </footer>
  );
}
