"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { updatePropertyDetails } from "@/app/actions/properties";

// Cabecera del editor: la dirección y la referencia se corrigen pinchando en ellas.
export function EditablePropertyHeader({
  propertyId,
  address,
  internalReference,
  action,
}: {
  propertyId: string;
  address: string;
  internalReference: string | null;
  action?: ReactNode;
}) {
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const skipBlurRef = useRef(false);
  const [title, setTitle] = useState(address);
  const [reference, setReference] = useState(internalReference ?? "");
  const [editingReference, setEditingReference] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(address);
  }, [address]);

  useEffect(() => {
    setReference(internalReference ?? "");
  }, [internalReference]);

  const resetValues = () => {
    setTitle(address);
    setReference(internalReference ?? "");
  };

  const save = async (nextAddress: string, nextReference: string) => {
    const cleanAddress = nextAddress.trim();
    const cleanReference = nextReference.trim();
    if (!cleanAddress) {
      resetValues();
      setError("La dirección es obligatoria.");
      return;
    }
    if (cleanAddress === address && cleanReference === (internalReference ?? "")) {
      setError(null);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await updatePropertyDetails(propertyId, {
        address: cleanAddress,
        internalReference: cleanReference,
      });
      if (!result.ok) {
        resetValues();
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      resetValues();
      setError("No se han podido guardar los cambios. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  // Enter guarda. Escape descarta lo escrito (se marca para que el blur no guarde).
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
    if (event.key === "Escape") {
      skipBlurRef.current = true;
      resetValues();
      event.currentTarget.blur();
    }
  };

  const consumeSkip = () => {
    if (!skipBlurRef.current) return false;
    skipBlurRef.current = false;
    return true;
  };

  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="group flex min-w-0 items-center gap-1">
          <input
            ref={titleRef}
            aria-label="Dirección de la propiedad"
            value={title}
            size={Math.min(Math.max(title.length, 6), 60)}
            maxLength={200}
            disabled={saving}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => {
              if (consumeSkip()) return;
              void save(title, reference);
            }}
            onKeyDown={handleKeyDown}
            className="-ml-2 min-w-0 max-w-full rounded-xl border border-transparent bg-transparent px-2 py-0.5 text-2xl font-semibold tracking-tight text-[#0F172A] outline-none transition hover:bg-[#F3F4F6] focus:border-[#D4AF37] focus:bg-white focus:ring-2 focus:ring-[#D4AF37]/30 disabled:opacity-60 md:text-3xl"
          />
          <button
            type="button"
            onClick={() => titleRef.current?.focus()}
            aria-label="Editar dirección"
            className="shrink-0 rounded-full p-1.5 text-[#9CA3AF] transition hover:bg-[#F3F4F6] hover:text-[#0F172A] focus:opacity-100 md:opacity-0 md:group-hover:opacity-100"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
        </div>

        <div className="mt-1 flex min-h-8 items-center gap-2 text-sm text-[#6B7280]">
          {editingReference ? (
            <input
              aria-label="Referencia interna"
              value={reference}
              placeholder="Referencia interna"
              maxLength={50}
              autoFocus
              onChange={(event) => setReference(event.target.value)}
              onBlur={() => {
                setEditingReference(false);
                if (consumeSkip()) return;
                void save(title, reference);
              }}
              onKeyDown={handleKeyDown}
              className="w-56 max-w-full rounded-lg border border-[#D4AF37] bg-white px-2 py-1 text-sm text-[#0F172A] outline-none ring-2 ring-[#D4AF37]/30"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingReference(true)}
              disabled={saving}
              className="-ml-2 rounded-lg px-2 py-1 transition hover:bg-[#F3F4F6] hover:text-[#0F172A] disabled:opacity-60"
            >
              {reference ? `Ref. ${reference}` : "+ Añadir referencia"}
            </button>
          )}
          {saving ? <span className="text-xs text-[#9CA3AF]">Guardando…</span> : null}
        </div>

        {error ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
