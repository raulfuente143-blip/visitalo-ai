import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export default function LandingPage() {
  return (
    <div className="flex flex-col bg-[#0F172A]">
      <MarketingNav />

      <section
        className="relative flex h-svh min-h-[560px] items-center overflow-hidden"
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
        <div className="absolute inset-0 bg-[#0F172A]/25 md:hidden" />
        <div className="relative z-10 w-full max-w-2xl px-6 pb-16 pt-24 md:px-16">
          <h1
            className="text-6xl md:text-8xl font-bold text-white mb-6 hero-content display-text"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              letterSpacing: "-0.03em",
              lineHeight: "1.05",
            }}
          >
            Tu <span className="text-[#D4AF37]">filmmaker</span><span className="text-white">,</span>
            <br />
            a demanda.
          </h1>
          <p className="text-base sm:text-lg max-w-xl mb-8 leading-relaxed text-balance hero-content-delay text-white/80 [text-shadow:0_1px_12px_rgba(0,0,0,0.45)]">
            Videos inmobiliarios profesionales.
            <br />
            Sin esperas, sin presupuestos, sin filmmaker.
          </p>
          <div className="hero-buttons mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href="/register"
              className="button-press rounded-full bg-[#D4AF37] px-8 py-4 text-center text-base font-bold text-[#0F172A] shadow-xl transition-all hover:bg-[#B8960C]"
            >
              Crear mi primer video
            </Link>
            <Link
              href="/casos-uso"
              className="button-press rounded-full border border-white/25 bg-white/5 px-8 py-4 text-center text-base text-white backdrop-blur-sm transition-all hover:bg-white/10"
            >
              Ver cómo funciona
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
