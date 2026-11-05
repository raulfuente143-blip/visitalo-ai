"use client";

import { useState } from "react";
import { deleteProperty } from "@/app/actions/properties";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function DeletePropertyButton({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await deleteProperty(propertyId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
    } catch {
      setError("No se ha podido eliminar la propiedad. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-50"
      >
        Eliminar
      </button>
      <ConfirmDialog
        open={open}
        busy={busy}
        error={error}
        title="¿Eliminar esta propiedad?"
        description="Se borrarán su plano, sus habitaciones, sus fotos y sus videos. Esta acción no se puede deshacer."
        onConfirm={() => {
          void handleConfirm();
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
