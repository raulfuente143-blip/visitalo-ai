export default function MarketingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-20">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-sky-400">
          Visitalo.ai
        </p>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight md:text-6xl">
          Automatiza tus videos inmobiliarios con IA.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          Una plataforma para agencias que venden más propiedades con contenido visual más rápido,
          consistente y escalable.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="/register"
            className="rounded-xl bg-sky-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-sky-400"
          >
            Empezar ahora
          </a>
          <a
            href="/login"
            className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-white transition hover:border-slate-500"
          >
            Iniciar sesión
          </a>
        </div>
      </section>
    </main>
  );
}
