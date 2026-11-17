"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { deleteProperty, updatePropertyDetails } from "@/app/actions/properties";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { buttonStyles, inputStyles, labelStyles } from "@/components/panel-ui";

type MenuPosition = { right: number; top?: number; bottom?: number };

const iconProps = {
  viewBox: "0 0 24 24",
  className: "h-4 w-4 shrink-0",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

// Menú ⋯ de cada propiedad: editar sus datos o eliminarla.
export function PropertyRowMenu({
  propertyId,
  address,
  internalReference,
}: {
  propertyId: string;
  address: string;
  internalReference: string | null;
}) {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftAddress, setDraftAddress] = useState(address);
  const [draftReference, setDraftReference] = useState(internalReference ?? "");

  const menuOpen = position !== null;

  // El menú se cierra al pulsar fuera, con Escape o al hacer scroll.
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setPosition(null);
    const handlePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      close();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", handlePointer);
    window.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!editOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) setEditOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [editOpen, busy]);

  const toggleMenu = () => {
    if (menuOpen) {
      setPosition(null);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const right = window.innerWidth - rect.right;
    // Si no cabe debajo, se abre hacia arriba.
    if (rect.bottom + 120 > window.innerHeight) {
      setPosition({ right, bottom: window.innerHeight - rect.top + 8 });
    } else {
      setPosition({ right, top: rect.bottom + 8 });
    }
  };

  const openEdit = () => {
    setPosition(null);
    setDraftAddress(address);
    setDraftReference(internalReference ?? "");
    setError(null);
    setEditOpen(true);
  };

  const openDelete = () => {
    setPosition(null);
    setError(null);
    setDeleteOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await updatePropertyDetails(propertyId, {
        address: draftAddress,
        internalReference: draftReference,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditOpen(false);
      router.refresh();
    } catch {
      setError("No se han podido guardar los cambios. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await deleteProperty(propertyId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDeleteOpen(false);
    } catch {
      setError("No se ha podido eliminar la propiedad. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const canPortal = typeof document !== "undefined";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        aria-label="Más opciones"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/[0.08] text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#0F172A]"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="19" cy="12" r="1.75" />
        </svg>
      </button>

      {position && canPortal
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ position: "fixed", right: position.right, top: position.top, bottom: position.bottom }}
              className="z-[60] w-48 rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={openEdit}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#F3F4F6]"
              >
                <svg {...iconProps}>
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                Editar datos
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={openDelete}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <svg {...iconProps}>
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </svg>
                Eliminar
              </button>
            </div>,
            document.body,
          )
        : null}

      {editOpen && canPortal
        ? createPortal(
            <div
              className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0F172A]/40 p-4 backdrop-blur-sm sm:items-center"
              onClick={() => {
                if (!busy) setEditOpen(false);
              }}
            >
              <form
                role="dialog"
                aria-modal="true"
                aria-labelledby={`edit-title-${propertyId}`}
                onSubmit={(event) => {
                  void handleSave(event);
                }}
                onClick={(event) => event.stopPropagation()}
                className="page-enter w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
              >
                <h2 id={`edit-title-${propertyId}`} className="text-xl font-semibold tracking-tight text-[#0F172A]">
                  Editar datos de la propiedad
                </h2>
                <p className="mt-2 text-sm text-pretty text-[#6B7280]">Los videos ya creados no cambian.</p>
                <div className="mt-6 space-y-4">
                  <div>
                    <label htmlFor={`edit-address-${propertyId}`} className={labelStyles}>
                      Dirección
                    </label>
                    <input
                      id={`edit-address-${propertyId}`}
                      value={draftAddress}
                      onChange={(event) => setDraftAddress(event.target.value)}
                      required
                      maxLength={200}
                      autoFocus
                      disabled={busy}
                      className={inputStyles}
                    />
                  </div>
                  <div>
                    <label htmlFor={`edit-reference-${propertyId}`} className={labelStyles}>
                      Referencia interna (opcional)
                    </label>
                    <input
                      id={`edit-reference-${propertyId}`}
                      value={draftReference}
                      onChange={(event) => setDraftReference(event.target.value)}
                      maxLength={50}
                      disabled={busy}
                      className={inputStyles}
                    />
                  </div>
                </div>
                {error ? (
                  <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                    {error}
                  </p>
                ) : null}
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    disabled={busy}
                    className={`${buttonStyles.secondary} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className={`${buttonStyles.primary} disabled:cursor-wait disabled:opacity-60`}
                  >
                    {busy ? "Guardando…" : "Guardar"}
                  </button>
                </div>
              </form>
            </div>,
            document.body,
          )
        : null}

      <ConfirmDialog
        open={deleteOpen}
        busy={busy}
        error={error}
        title="¿Eliminar esta propiedad?"
        description="Se borrarán su plano, sus habitaciones, sus fotos y sus videos. Esta acción no se puede deshacer."
        onConfirm={() => {
          void handleDelete();
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
