"use client";

import { useState } from "react";
import { deleteProperty } from "@/app/actions/properties";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function DeletePropertyButton({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await deleteProperty(propertyId);
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-50"
      >
        Eliminar
      </button>
      <ConfirmDialog
        open={open}
        busy={busy}
        title="¿Eliminar esta propiedad?"
        description="Se eliminarán también su plano, sus habitaciones y sus fotos. Esta acción no se puede deshacer."
        onConfirm={() => {
          void handleConfirm();
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
