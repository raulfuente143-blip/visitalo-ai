"use client";

import { deleteAllVideos } from "@/app/actions/video";

export function DeleteAllVideosButton() {
  const handleDeleteAll = async () => {
    if (!window.confirm("¿Eliminar todos los videos de esta agencia? Esta acción no se puede deshacer.")) return;
    await deleteAllVideos();
  };

  return (
    <button
      type="button"
      onClick={handleDeleteAll}
      className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
    >
      Eliminar todos
    </button>
  );
}
