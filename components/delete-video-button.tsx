"use client";

import { useState } from "react";
import { deleteVideo } from "@/app/actions/video";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function DeleteVideoButton({ videoId }: { videoId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await deleteVideo(videoId);
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
        title="¿Eliminar este video?"
        description="Desaparecerá de tu lista y no se podrá recuperar. Eliminarlo no lo devuelve al contador de tu plan."
        onConfirm={() => {
          void handleConfirm();
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
