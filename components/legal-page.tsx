import type { ReactNode } from "react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { legal } from "@/lib/legal";

export type LegalSection = {
  title: string;
  body: ReactNode;
};

export function HolderDetails() {
  return (
    <ul>
      <li>
        <strong>Titular:</strong> {legal.holderName}
      </li>
      <li>
        <strong>NIF:</strong> {legal.holderId}
      </li>
      <li>
        <strong>Domicilio:</strong> {legal.holderAddress}
      </li>
      <li>
        <strong>Email de contacto:</strong> <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>
      </li>
      <li>
        <strong>Sitio web:</strong> {legal.website}
      </li>
    </ul>
  );
}

export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro?: string;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <MarketingNav />
      <main className="px-6 pt-28 pb-20 md:px-16 md:pt-36">
        <article className="mx-auto max-w-3xl page-enter">
          <p className="text-[#D4AF37] text-xs font-medium tracking-[0.3em] uppercase mb-5">Legal</p>
          <h1
            className="text-4xl md:text-5xl font-bold leading-[1.05] display-text text-balance"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", letterSpacing: "-0.03em" }}
          >
            {title}
          </h1>
          <p className="mt-4 text-sm text-[#64748B]">Última actualización: {legal.lastUpdated}</p>
          {intro ? <p className="mt-8 text-base leading-relaxed text-pretty text-[#94A3B8]">{intro}</p> : null}

          <div className="mt-12 space-y-10">
            {sections.map((section, index) => (
              <section key={section.title} className="border-t border-white/10 pt-8 first:border-t-0 first:pt-0">
                <h2 className="text-lg font-semibold text-white">
                  {index + 1}. {section.title}
                </h2>
                <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-pretty text-[#94A3B8] [&_a]:text-[#D4AF37] [&_a:hover]:text-[#B8960C] [&_strong]:font-medium [&_strong]:text-white [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                  {section.body}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
