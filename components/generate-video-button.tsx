"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createVideo } from "@/app/actions/video";
import { processVideoInBrowser } from "@/app/actions/video-processor";

export function GenerateVideoButton({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    setShowPlans(false);

    try {
      const result = await createVideo(propertyId);

      if (!result.ok) {
        setError(result.error);
        setShowPlans(result.reason === "limit" || result.reason === "rooms");
        setIsGenerating(false);
        return;
      }

      await processVideoInBrowser(result.videoId, propertyId);
      router.push(`/videos/${result.videoId}`);
    } catch (err) {
      console.error("Error generando video:", err);
      setError("No se ha podido generar el video. Inténtalo de nuevo.");
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[#D4AF37] px-6 py-3 text-base font-semibold text-[#0F172A] shadow-sm transition-colors hover:bg-[#B8960C] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isGenerating ? "Generando video..." : "Generar video"}
      </button>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <p>{error}</p>
          {showPlans ? (
            <Link href="/billing" className="mt-2 inline-block font-medium text-[#0F172A] underline underline-offset-2">
              Ver planes
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
