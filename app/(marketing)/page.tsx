import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col bg-[#0F172A]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');`}</style>

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
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/quienes-somos" className="hidden text-sm text-[#9CA3AF] transition-colors hover:text-white md:inline">Quiénes somos</Link>
          <Link href="/casos-uso" className="hidden text-sm text-[#9CA3AF] transition-colors hover:text-white md:inline">Casos de uso</Link>
          <Link href="/planes" className="hidden text-sm text-[#9CA3AF] transition-colors hover:text-white md:inline">Planes</Link>
          <Link href="/login" className="text-sm text-[#9CA3AF] transition-colors hover:text-white">Iniciar sesión</Link>
          <Link href="/register" className="rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#0F172A] shadow-lg transition-all hover:bg-[#B8960C]">Empieza gratis</Link>
        </div>
      </nav>

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
            className="hero-content text-5xl md:text-7xl font-bold text-white mb-6"
            style={{
              fontFamily: "'Playfair Display', serif",
              letterSpacing: "-0.03em",
              lineHeight: "1.05",
            }}
          >
            Tu <span className="text-[#D4AF37]">filmmaker,</span>
            <br />
            siempre disponible.
          </h1>
          <p className="hero-content-delay mb-8 max-w-xl text-lg leading-relaxed text-[#94A3B8]">
            Olvídate de pagar 500€ por sesión. Sube el plano, añade las fotos y obtén un video profesional con tu marca en menos de 10 minutos.
          </p>
          <div className="hero-buttons mb-6 flex flex-wrap gap-4">
            <Link href="/register" className="button-press rounded-full bg-[#D4AF37] px-8 py-4 text-base font-bold text-[#0F172A] shadow-xl transition-all hover:bg-[#B8960C]">Crear mi primer video</Link>
            <Link href="/casos-uso" className="button-press rounded-full border border-white/20 px-8 py-4 text-base text-white transition-all hover:bg-white/5">Ver cómo funciona</Link>
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
