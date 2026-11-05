"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createVideo, failVideoAndRefund } from "@/app/actions/video";
import { processVideoInBrowser, type VideoProgress } from "@/app/actions/video-processor";
import { buttonStyles } from "@/components/panel-ui";

type LimitModal = { title: string; body: string };

export function GenerateVideoButton({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<LimitModal | null>(null);

  useEffect(() => {
    if (!isGenerating) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isGenerating]);

  useEffect(() => {
    if (!modal) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modal]);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    setModal(null);
    setProgress({ stage: "preparing", percent: 1, label: "Comprobando tu plan…" });

    let videoId: string | null = null;

    try {
      const result = await createVideo(propertyId);

      if (!result.ok) {
        setIsGenerating(false);
        setProgress(null);
        if (result.reason === "limit") {
          setModal({ title: "¿Seguimos?", body: result.error });
        } else if (result.reason === "rooms") {
          setModal({ title: "Esta propiedad necesita un plan mayor", body: result.error });
        } else {
          setError(result.error);
        }
        return;
      }

      videoId = result.videoId;
      await processVideoInBrowser(videoId, propertyId, setProgress);
      router.push(`/videos/${videoId}`);
    } catch (err) {
      console.error("Error generando video:", err);
      let refunded = false;
      if (videoId) {
        try {
          const message = err instanceof Error ? err.message : "Error desconocido";
          const refund = await failVideoAndRefund(videoId, message);
          refunded = refund.refunded;
        } catch {
          refunded = false;
        }
      }
      setError(
        refunded
          ? "No se ha podido generar el video. No se ha descontado de tu plan: inténtalo de nuevo."
          : "No se ha podido generar el video. Inténtalo de nuevo.",
      );
      setIsGenerating(false);
      setProgress(null);
    }
  }

  const percent = progress ? Math.max(1, Math.min(100, progress.percent)) : 0;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-full bg-[#D4AF37] px-6 py-3 text-base font-semibold text-[#0F172A] shadow-sm transition-colors hover:bg-[#B8960C] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isGenerating ? "Generando video…" : "Generar video"}
      </button>

      {isGenerating && progress ? (
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5" role="status" aria-live="polite">
          <div className="flex items-baseline justify-between gap-4">
            <p className="min-w-0 truncate text-sm font-medium text-[#0F172A]">{progress.label}</p>
            <p className="shrink-0 text-sm tabular-nums text-[#6B7280]">{percent} %</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F1F1F1]">
            <div
              className="h-full rounded-full bg-[#D4AF37] transition-[width] duration-300 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-pretty text-[#6B7280]">
            No cierres ni cambies de pestaña hasta que termine: el video se está creando en tu navegador.
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      {modal ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-[#0F172A]/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="limit-modal-title"
            className="page-enter w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="limit-modal-title" className="text-2xl font-semibold tracking-tight text-[#0F172A]">
              {modal.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-pretty text-[#6B7280]">{modal.body}</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setModal(null)} className={buttonStyles.secondary}>
                Ahora no
              </button>
              <Link href="/billing" className={buttonStyles.primary}>
                Ver planes
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
