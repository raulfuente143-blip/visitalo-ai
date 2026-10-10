"use client";

import { deleteVideo } from "@/app/actions/video";

export function DeleteVideoButton({ videoId }: { videoId: string }) {
  const handleDelete = async () => {
    if (!window.confirm("¿Eliminar este video?")) return;
    await deleteVideo(videoId);
  };

  return (
    <button
      onClick={handleDelete}
      className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
    >
      Eliminar
    </button>
  );
}
