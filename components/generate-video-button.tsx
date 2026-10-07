"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createVideo } from "@/app/actions/video";
import { processVideoInBrowser } from "@/app/actions/video-processor";

export function GenerateVideoButton({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    try {
      const videoId = await createVideo(propertyId);
      await processVideoInBrowser(videoId, propertyId);
      router.push(`/videos/${videoId}`);
    } catch (err) {
      console.error("Error generando video:", err);
      setError(err instanceof Error ? err.message : String(err));
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        className="inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isGenerating ? "Generando video..." : "Generar video"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
