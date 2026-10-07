"use client";

import { use, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const VIDEO_STATUS = {
  pending: "pending",
  processing: "processing",
  completed: "completed",
  failed: "failed",
} as const;

type VideoStatus = (typeof VIDEO_STATUS)[keyof typeof VIDEO_STATUS];

type Video = {
  id: string;
  status: VideoStatus;
  output_url: string | null;
  error_message: string | null;
};

export default function VideoStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const fetchVideo = async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("id, status, output_url, error_message")
        .eq("id", id)
        .single();

      console.log("[status] fetch resultado:", { data, error });

      if (error || !data) {
        setError("No se pudo cargar el video");
        return;
      }

      console.log("[status] Video status:", data?.status, data);
      setVideo(data);

      if (data.status === "completed" || data.status === "failed") {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    };

    fetchVideo();
    intervalRef.current = setInterval(fetchVideo, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    if (video) {
      setLoading(false);
    }
  }, [video]);

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  if (loading || !video) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
          <p className="mt-4 font-medium">Preparando tu video...</p>
        </div>
      </main>
    );
  }

  if (video.status === VIDEO_STATUS.pending) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
          <p className="mt-4 font-medium">Preparando tu video...</p>
        </div>
      </main>
    );
  }

  if (video.status === VIDEO_STATUS.processing) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
          <p className="mt-4 font-medium">Generando video...</p>
        </div>
      </main>
    );
  }

  if (video.status === VIDEO_STATUS.completed) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Video generado</h1>
          <p className="mt-2 text-sm text-slate-500">Tu recorrido virtual está listo.</p>
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <video src={video.output_url ?? undefined} controls autoPlay className="w-full bg-slate-950" />
          </div>
          {video.output_url ? (
            <a
              href={video.output_url}
              download
              className="mt-6 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500"
            >
              Descargar video
            </a>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-red-700">No se pudo generar el video</h1>
        <p className="mt-2 text-red-600">{video.error_message ?? "Ocurrió un error desconocido."}</p>
      </div>
    </main>
  );
}
