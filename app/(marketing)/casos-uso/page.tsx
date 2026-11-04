import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import AmbientVideo from "@/components/ambient-video";

const soluciones = [
  {
    text: "El vídeo se genera el mismo día de la visita.",
    result: "De días a horas.",
  },
  {
    text: "Cada vídeo incluye el logo, el color y la identidad de la agencia.",
    result: "Una imagen coherente en cada propiedad.",
  },
  {
    text: "Una cuota mensual fija cubre toda la producción visual del equipo.",
    result: "Un coste predecible.",
  },
  {
    text: "El comercial sube el plano y las fotos. Visitalo.ai hace el resto.",
    result: "El equipo se dedica a vender.",
  },
];

export default function CasosDeUso() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <MarketingNav />
      <main className="min-h-screen flex items-center px-6 md:px-16 pt-28 md:pt-24 pb-12 md:pb-10">
        <div className="w-full max-w-7xl mx-auto grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-10 md:gap-16 lg:gap-20 items-center">
          <div className="page-enter">
            <p className="text-[#D4AF37] text-xs font-medium tracking-[0.3em] uppercase mb-5">
              Casos de uso
            </p>
            <h1
              className="text-4xl md:text-5xl font-bold leading-[1.05] display-text"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif", letterSpacing: "-0.03em" }}
            >
              El problema<br />es el proceso.
            </h1>
            <p className="text-sm md:text-base text-[#94A3B8] leading-relaxed mt-4 max-w-lg text-balance">
              Publicar una propiedad con contenido visual profesional lleva días y depende de
              terceros. Visitalo.ai elimina esa dependencia.
            </p>

            <div className="mt-6 w-full max-w-[560px] overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
              <AmbientVideo
                src="/videos/casos-uso.mp4"
                poster="/videos/casos-uso-poster.jpg"
                className="pointer-events-none block aspect-video w-full select-none object-cover"
              />
            </div>
          </div>

          <div className="page-enter-delay-1">
            {soluciones.map((s, i) => (
              <div key={i} className="border-t border-white/10 py-5 first:border-t-0 first:pt-0">
                <p className="text-xs text-[#D4AF37] font-medium tracking-widest mb-2">0{i + 1}</p>
                <p className="text-white text-lg md:text-xl leading-snug mb-2 text-balance">{s.text}</p>
                <p className="text-[#D4AF37] text-sm font-medium">{s.result}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
