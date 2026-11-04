import type { ReactNode } from "react";

export const buttonStyles = {
  primary:
    "inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[#D4AF37] px-4 py-2.5 text-sm sm:px-5 font-semibold text-[#0F172A] shadow-sm transition-colors hover:bg-[#B8960C]",
  dark:
    "inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[#0F172A] px-4 py-2.5 text-sm sm:px-5 font-medium text-white transition-colors hover:bg-[#1E293B]",
  secondary:
    "inline-flex items-center justify-center whitespace-nowrap rounded-full border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm sm:px-5 font-medium text-[#0F172A] transition-colors hover:bg-[#F9FAFB]",
};

export const inputStyles =
  "w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-base text-[#0F172A] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30";

export const labelStyles = "mb-2 block text-sm font-medium text-[#6B7280]";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A] md:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-pretty text-[#6B7280]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}
