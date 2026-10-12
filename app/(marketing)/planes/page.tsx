import Link from "next/link";

const plans = [
  {
    name: "Starter",
    description: "Para agencias que empiezan",
    price: "20€",
    features: ["3 videos al mes", "6 habitaciones por video", "1 usuario", "Branding básico"],
    featured: false,
  },
  {
    name: "Pro",
    description: "Para agencias activas",
    price: "45€",
    features: ["8 videos al mes", "8 habitaciones por video", "2 usuarios", "Optimizador de fotos", "Staging add-on disponible"],
    featured: true,
  },
  {
    name: "Agencia",
    description: "Para franquicias y grandes equipos",
    price: "100€",
    features: ["20 videos al mes", "10 habitaciones por video", "5 usuarios", "Fotos ilimitadas", "3 stagings incluidos"],
    featured: false,
  },
];

export default function PlansPage() {
  return (
    <main className="min-h-screen bg-[#0F172A] px-8 py-16 text-white md:px-16">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-[#D4AF37] transition-colors hover:text-white">
          ← Volver al inicio
        </Link>
        <h1 className="mt-8 text-center text-4xl font-bold">Planes para cada agencia</h1>
        <p className="mt-4 text-center text-lg text-[#94A3B8]">Sin permanencia. Cambia o cancela cuando quieras.</p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <section
              key={plan.name}
              className={`relative flex flex-col rounded-3xl border p-8 ${plan.featured ? "border-[#D4AF37]/50 bg-white/5" : "border-white/10 bg-white/5"}`}
            >
              {plan.featured ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#D4AF37] px-4 py-1 text-xs font-bold text-[#0F172A]">
                  Más popular
                </span>
              ) : null}
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="mb-6 mt-2 text-sm text-[#94A3B8]">{plan.description}</p>
              <p className="text-4xl font-bold">{plan.price}<span className="text-lg font-normal text-[#94A3B8]">/mes</span></p>
              <ul className="my-6 flex-1 space-y-2 text-sm text-[#94A3B8]">
                {plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}
              </ul>
              <Link
                href="/register"
                className={plan.featured
                  ? "rounded-full bg-[#D4AF37] py-3 text-center text-sm font-bold text-[#0F172A] transition-all hover:bg-[#B8960C]"
                  : "rounded-full border border-white/20 py-3 text-center text-sm font-medium text-white transition-all hover:bg-white/5"}
              >
                Empezar ahora
              </Link>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
