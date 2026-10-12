import Link from "next/link";

export default function UseCasesPage() {
  return (
    <main className="flex min-h-screen flex-col items-start justify-center bg-[#0F172A] px-8 text-white md:px-16">
      <h1 className="text-4xl font-bold md:text-6xl">Casos de uso</h1>
      <Link href="/" className="mt-8 text-[#D4AF37] transition-colors hover:text-white">
        ← Volver al inicio
      </Link>
    </main>
  );
}
