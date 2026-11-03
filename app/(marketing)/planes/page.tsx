import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

function Check() {
  return <span className="text-[#D4AF37]">✓</span>;
}

function Soon() {
  return (
    <span className="ml-2 text-[10px] uppercase tracking-wider text-[#D4AF37]/80 border border-[#D4AF37]/30 rounded-full px-2 py-0.5">
      Próximamente
    </span>
  );
}

export default function Planes() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <MarketingNav />
      <main className="min-h-screen flex items-center px-8 md:px-16 pt-24 pb-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-8 page-enter">
            <p className="text-[#D4AF37] text-xs font-medium tracking-[0.3em] uppercase mb-4">
              Planes
            </p>
            <h1
              className="text-4xl md:text-5xl font-bold leading-[1.05] display-text"
              style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "-0.03em" }}
            >
              Dos planes. Un mismo estándar.
            </h1>
            <p className="text-[#64748B] mt-4 text-sm md:text-base">
              Facturación mensual por oficina. Sin permanencia. {" "}
              <a href="mailto:hola@visitalo.ai" className="text-[#D4AF37] hover:text-[#B8960C] transition-colors">
                ¿Más de 10 oficinas? Escríbenos.
              </a>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch page-enter-delay-1">
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 flex flex-col">
              <h2 className="text-xl font-bold text-white/90 mb-1">Vídeos</h2>
              <p className="text-[#64748B] text-sm mb-5">Para equipos que publican con regularidad.</p>
              <div className="text-4xl font-bold text-white/90 mb-6">
                40€<span className="text-base font-normal text-[#64748B]">/mes</span>
              </div>
              <ul className="space-y-2 text-[13px] text-[#94A3B8] flex-1 mb-6">
                <li className="flex items-center gap-3"><Check /> 8 vídeos al mes</li>
                <li className="flex items-center gap-3"><Check /> Hasta 8 habitaciones · 2 fotos cada una</li>
                <li className="flex items-center gap-3"><Check /> Logo y color de marca</li>
                <li className="flex items-center gap-3"><Check /> 2 usuarios</li>
              </ul>
              <Link href="/register" className="border border-white/20 text-white text-center py-3 rounded-full hover:bg-white/5 transition-all text-sm font-medium">
                Empezar ahora
              </Link>
            </div>

            <div className="relative bg-white/[0.07] border border-[#D4AF37]/50 rounded-3xl p-8 flex flex-col shadow-[0_0_80px_-20px_rgba(212,175,55,0.35)]">
              <span className="absolute -top-3 left-8 bg-[#D4AF37] text-[#0F172A] text-xs font-bold px-4 py-1 rounded-full tracking-wide">
                Recomendado
              </span>
              <h2 className="text-xl font-bold text-white mb-1">Pro</h2>
              <p className="text-[#94A3B8] text-sm mb-5">Vídeo y fotografía en un solo plan.</p>
              <div className="text-4xl font-bold text-white mb-6">
                100€<span className="text-base font-normal text-[#94A3B8]">/mes</span>
              </div>
              <ul className="space-y-2 text-[13px] text-[#CBD5E1] flex-1 mb-6">
                <li className="flex items-center gap-3"><Check /> 20 vídeos al mes</li>
                <li className="flex items-center gap-3"><Check /> Hasta 10 habitaciones · 2 fotos cada una</li>
                <li className="flex items-center gap-3"><Check /> Logo y color de marca</li>
                <li className="flex items-center gap-3"><Check /> 5 usuarios</li>
                <li className="flex items-center gap-3"><Check /> Optimizador de fotos ilimitado <Soon /></li>
                <li className="flex items-center gap-3"><Check /> Staging virtual: 3 al mes <Soon /></li>
              </ul>
              <Link href="/register" className="bg-[#D4AF37] text-[#0F172A] text-center py-3 rounded-full hover:bg-[#B8960C] transition-all text-sm font-bold shadow-lg">
                Empezar ahora
              </Link>
            </div>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
