"use client";

import { useState } from "react";
import { deleteVideo } from "@/app/actions/video";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function DeleteVideoButton({ videoId }: { videoId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await deleteVideo(videoId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
    } catch {
      setError("No se ha podido eliminar el video. Inténtalo de nuevo.");
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
        title="¿Eliminar este video?"
        description="Se borrará el video y su archivo. Esta acción no se puede deshacer y no lo devuelve al contador de tu plan."
        onConfirm={() => {
          void handleConfirm();
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
