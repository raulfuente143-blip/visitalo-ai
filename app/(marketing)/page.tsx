import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";

export default function LandingPage() {
  return (
    <div className="flex flex-col bg-[#0F172A]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');`}</style>

      <MarketingNav />

      <section
        className="h-screen relative overflow-hidden flex items-center"
        style={{
          backgroundImage: "url('/hero-room.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <style>{`
          @keyframes heroFadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .hero-content {
            animation: heroFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .hero-content-delay {
            opacity: 0;
            animation: heroFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
          }
          .hero-buttons {
            opacity: 0;
            animation: heroFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
          }
          .button-press:active {
            transform: scale(0.97);
            transition: transform 80ms ease-out;
          }
          @media (prefers-reduced-motion: reduce) {
            .hero-content, .hero-content-delay, .hero-buttons { animation: none; opacity: 1; }
          }
        `}</style>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/60 via-[#0F172A]/40 to-transparent" />
        <div className="relative z-10 max-w-2xl px-8 pb-16 pt-24 md:px-16">
          <h1
            className="text-6xl md:text-8xl font-bold text-white mb-6 hero-content display-text"
            style={{
              fontFamily: "'Playfair Display', serif",
              letterSpacing: "-0.03em",
              lineHeight: "1.05",
            }}
          >
            Tu <span className="text-[#D4AF37]">filmmaker</span><span className="text-white">,</span>
            <br />
            a demanda.
          </h1>
          <p className="text-lg max-w-xl mb-8 leading-relaxed hero-content-delay text-white/80 [text-shadow:0_1px_12px_rgba(0,0,0,0.45)]">
            Videos inmobiliarios profesionales.
            <br />
            Sin esperas, sin presupuestos, sin filmmaker.
          </p>
          <div className="hero-buttons mb-6 flex flex-wrap gap-4">
            <Link href="/register" className="button-press rounded-full bg-[#D4AF37] px-8 py-4 text-base font-bold text-[#0F172A] shadow-xl transition-all hover:bg-[#B8960C]">Crear mi primer video</Link>
            <Link
              href="/casos-uso"
              className="border border-white/20 text-white px-8 py-4 rounded-full text-base hover:bg-white/5 transition-all button-press"
            >
              Ver cómo funciona
            </Link>
          </div>
        </div>
      </section>

      <footer className="flex items-center justify-between border-t border-white/5 bg-[#0a0f1a] px-8 py-6 md:px-16">
        <span className="text-lg font-bold tracking-tight text-white">Visitalo<span className="text-[#D4AF37]">.ai</span></span>
        <div className="flex items-center gap-4 text-xs text-[#64748B] md:gap-6 md:text-sm">
          <Link href="/legal/privacidad" className="transition-colors hover:text-white">Privacidad</Link>
          <Link href="/legal/cookies" className="transition-colors hover:text-white">Cookies</Link>
          <Link href="/legal/terminos" className="transition-colors hover:text-white">Términos</Link>
        </div>
      </footer>
    </div>
  );
}
