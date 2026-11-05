"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, PageHeader, buttonStyles } from "@/components/panel-ui";

type VideoStatus = "pending" | "processing" | "completed" | "failed";

type PropertyInfo = {
  name: string | null;
  address: string | null;
  internal_reference: string | null;
};

type Video = {
  id: string;
  status: VideoStatus;
  output_url: string | null;
  error_message: string | null;
  created_at: string;
  property_id: string;
  properties: PropertyInfo | PropertyInfo[] | null;
};

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

function buildDownloadUrl(video: Video, property: PropertyInfo | null) {
  if (!video.output_url) return null;
  const extension = video.output_url.split("?")[0].toLowerCase().endsWith(".webm") ? "webm" : "mp4";
  const date = video.created_at.slice(0, 10);
  const place = slugify(property?.address || property?.name || "") || "propiedad";
  const reference = property?.internal_reference ? slugify(property.internal_reference) : "";
  const fileName = ["visitalo", reference, place, date].filter(Boolean).join("-") + `.${extension}`;
  const separator = video.output_url.includes("?") ? "&" : "?";
  return `${video.output_url}${separator}download=${encodeURIComponent(fileName)}`;
}

export default function VideoStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const fetchVideo = async () => {
      const { data, error: fetchError } = await supabase
        .from("videos")
        .select("id, status, output_url, error_message, created_at, property_id, properties(name, address, internal_reference)")
        .eq("id", id)
        .single();

      if (fetchError || !data) {
        setError("No se ha podido cargar el video.");
        return;
      }

      const current = data as unknown as Video;
      setVideo(current);

      if ((current.status === "completed" || current.status === "failed") && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

    void fetchVideo();
    intervalRef.current = setInterval(fetchVideo, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [id]);

  const property = video ? (Array.isArray(video.properties) ? video.properties[0] ?? null : video.properties) : null;
  const description = [property?.name, property?.address].filter(Boolean).join(" · ");
  const backAction = (
    <Link href="/videos" className={`${buttonStyles.secondary} w-full sm:w-auto`}>
      Todos los videos
    </Link>
  );

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Video" action={backAction} />
        <Card className="py-10 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!video || video.status === "pending" || video.status === "processing") {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Generando video" description={description} action={backAction} />
        <Card className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#D4AF37]" />
          <p className="mt-4 font-medium text-[#0F172A]">Preparando tu video…</p>
        </Card>
      </div>
    );
  }

  if (video.status === "failed") {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="No se ha podido generar el video" description={description} action={backAction} />
        <Card className="py-10 text-center">
          <p className="mx-auto max-w-md text-sm text-pretty text-red-600">
            {video.error_message ?? "Ha ocurrido un error inesperado."}
          </p>
          <Link href={`/properties/${video.property_id}/video`} className={`${buttonStyles.primary} mt-6`}>
            Intentarlo de nuevo
          </Link>
        </Card>
      </div>
    );
  }

  const downloadUrl = buildDownloadUrl(video, property);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Video listo" description={description} action={backAction} />
      <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-black shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <video
          src={video.output_url ?? undefined}
          controls
          autoPlay
          playsInline
          className="block aspect-video w-full bg-black"
        />
      </section>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:flex">
        {downloadUrl ? (
          <a href={downloadUrl} className={buttonStyles.dark}>
            Descargar video
          </a>
        ) : null}
        <Link href={`/properties/${video.property_id}/video`} className={buttonStyles.secondary}>
          Crear otro video
        </Link>
      </div>
    </div>
  );
}
