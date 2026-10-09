import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href: string;
};

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.href}-${item.label}`} className="inline-flex items-center gap-2">
            {index > 0 ? <span className="text-[#D1D5DB]">/</span> : null}
            {isLast ? (
              <span className="font-bold text-[#111827]" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="text-[#6B7280] hover:text-[#111827]">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
