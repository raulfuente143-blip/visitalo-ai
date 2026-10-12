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
      className="border border-red-200 text-red-500 rounded-full px-5 py-2 text-sm font-medium hover:bg-red-50 transition-all duration-200"
    >
      Eliminar
    </button>
  );
}
