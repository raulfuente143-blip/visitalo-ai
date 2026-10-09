"use client";

import { use, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Breadcrumb } from "@/components/breadcrumb";

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

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: "Videos", href: "/videos" },
        { label: "Video generado", href: `/videos/${id}` },
      ]}
    />
  );

  if (error) {
    return (
      <div className="mx-auto max-w-4xl text-[#111827]">
        {breadcrumb}
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !video) {
    return (
      <div className="mx-auto max-w-4xl text-[#111827]">
        {breadcrumb}
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#D4AF37]" />
          <p className="mt-4 font-medium">Preparando tu video...</p>
        </div>
      </div>
    );
  }

  if (video.status === VIDEO_STATUS.pending) {
    return (
      <div className="mx-auto max-w-4xl text-[#111827]">
        {breadcrumb}
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#D4AF37]" />
          <p className="mt-4 font-medium">Preparando tu video...</p>
        </div>
      </div>
    );
  }

  if (video.status === VIDEO_STATUS.processing) {
    return (
      <div className="mx-auto max-w-4xl text-[#111827]">
        {breadcrumb}
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#D4AF37]" />
          <p className="mt-4 font-medium">Generando video...</p>
        </div>
      </div>
    );
  }

  if (video.status === VIDEO_STATUS.completed) {
    return (
      <div className="mx-auto max-w-4xl text-[#111827]">
        {breadcrumb}
        <div>
          <h1 className="mb-2 text-2xl font-bold text-[#111827]">Video generado</h1>
          <p className="mb-6 text-sm text-[#6B7280]">Tu recorrido virtual está listo.</p>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <video src={video.output_url ?? undefined} controls autoPlay className="w-full bg-black" />
          </div>
          {video.output_url ? (
            <a
              href={video.output_url}
              download
              className="mt-6 inline-flex rounded-xl bg-[#111827] px-6 py-3 text-white transition hover:bg-[#1F2937]"
            >
              Descargar video
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl text-[#111827]">
      {breadcrumb}
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-red-700">No se pudo generar el video</h1>
        <p className="mt-2 text-red-600">{video.error_message ?? "Ocurrió un error desconocido."}</p>
      </div>
    </div>
  );
}
