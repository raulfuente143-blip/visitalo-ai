import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export default function QuienesSomos() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <MarketingNav />
      <main className="min-h-screen flex items-center px-8 md:px-16 pt-24 pb-10">
        <div className="w-full max-w-7xl mx-auto grid md:grid-cols-2 gap-10 md:gap-20 items-center">
          <div className="page-enter">
            <p className="text-[#D4AF37] text-xs font-medium tracking-[0.3em] uppercase mb-6">
              Quiénes somos
            </p>
            <h1
              className="text-5xl md:text-7xl font-bold leading-[0.98] display-text"
              style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "-0.03em" }}
            >
              Construido<br />
              <span className="text-[#D4AF37]">desde</span><br />
              dentro.
            </h1>
          </div>

          <div className="space-y-5 page-enter-delay-1">
            <p className="text-xl text-[#94A3B8] leading-relaxed border-l-2 border-[#D4AF37]/30 pl-6">
              Visitalo.ai no nació en una sala de reuniones.<br />Nació en una visita.
            </p>
            <p className="text-[#64748B] leading-relaxed">
              Lo creó alguien del sector inmobiliario que, semana tras semana, vio cuánto esfuerzo
              exige producir contenido visual antes de publicar una propiedad: fotógrafos,
              realizadores, coordinaciones, revisiones.
            </p>
            <p className="text-white text-lg leading-relaxed font-medium">
              La pregunta era inevitable: ¿por qué no puede hacerlo el propio comercial,
              en la misma visita, con los recursos que ya tiene?
            </p>
            <p className="text-[#64748B] leading-relaxed">
              Visitalo.ai convierte las fotos del comercial en vídeos profesionales con la identidad
              de la agencia. Sin intermediarios. Sin esperas. Una herramienta construida por alguien
              que conoce el problema, porque lo ha vivido.
            </p>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
