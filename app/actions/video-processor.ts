"use client";

import { createClient } from "@/lib/supabase/client";

export type VideoProgress = {
  stage: "preparing" | "recording" | "uploading" | "done";
  percent: number;
  label: string;
};

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 30;
const ZOOM = 0.06;
const FADE_MS = 450;
const SINGLE_PHOTO_MS = 3000;
const DOUBLE_PHOTO_MS = 2000;

type Segment = {
  image: HTMLCanvasElement;
  label: string;
  duration: number;
  zoneIndex: number;
  zoneCount: number;
  panDirection: 1 | -1;
};

type Overlay = {
  logo: HTMLImageElement | null;
  brandColor: string;
  fontFamily: string;
};

type PhotoRow = { photo_slot: number; url: string | null };
type ZoneRow = { name: string; room_order: number; property_zone_photos: PhotoRow[] | null };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function pickMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4;codecs=avc3",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

async function loadImage(url: string, objectUrls: string[]): Promise<HTMLImageElement> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("No se ha podido cargar una de las fotos.");
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  objectUrls.push(objectUrl);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Una de las fotos no se puede leer. Prueba a subirla de nuevo en JPG o PNG."));
    image.src = objectUrl;
  });
}

function prerenderCover(image: HTMLImageElement): HTMLCanvasElement {
  const width = Math.round(WIDTH * (1 + ZOOM));
  const height = Math.round(HEIGHT * (1 + ZOOM));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Tu navegador no permite preparar las fotos.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  return canvas;
}

function drawOverlay(ctx: CanvasRenderingContext2D, label: string, overlay: Overlay) {
  if (overlay.logo) {
    const maxWidth = 140;
    const maxHeight = 80;
    const ratio = Math.min(maxWidth / overlay.logo.naturalWidth, maxHeight / overlay.logo.naturalHeight);
    const logoWidth = overlay.logo.naturalWidth * ratio;
    const logoHeight = overlay.logo.naturalHeight * ratio;
    ctx.globalAlpha = 0.92;
    ctx.drawImage(overlay.logo, 28, 24, logoWidth, logoHeight);
    ctx.globalAlpha = 1;
  }

  const barHeight = 64;
  const barY = HEIGHT - barHeight;

  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(0, barY, WIDTH, barHeight);
  ctx.fillStyle = overlay.brandColor;
  ctx.fillRect(0, barY, WIDTH, 3);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `600 26px ${overlay.fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, WIDTH / 2, barY + barHeight / 2 + 2);

  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.font = `600 16px ${overlay.fontFamily}`;
  ctx.textAlign = "right";
  ctx.fillText("visitalo.ai", WIDTH - 28, barY + barHeight / 2 + 2);
}

function drawFrame(ctx: CanvasRenderingContext2D, segment: Segment, elapsed: number, overlay: Overlay) {
  const t = Math.min(Math.max(elapsed / segment.duration, 0), 1);
  const eased = t * t * (3 - 2 * t);
  const scale = 1 + ZOOM * eased;
  const drawWidth = WIDTH * scale;
  const drawHeight = HEIGHT * scale;
  const maxShift = (drawWidth - WIDTH) / 2;
  const dx = (WIDTH - drawWidth) / 2 + segment.panDirection * maxShift * 0.8;
  const dy = (HEIGHT - drawHeight) / 2;
  const fade = Math.max(0, Math.min(1, elapsed / FADE_MS, (segment.duration - elapsed) / FADE_MS));

  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.globalAlpha = fade;
  ctx.drawImage(segment.image, dx, dy, drawWidth, drawHeight);
  ctx.globalAlpha = 1;
  drawOverlay(ctx, segment.label, overlay);
}

// El tiempo se mide con el reloj: cada tramo dura lo que debe aunque el ordenador vaya lento.
function renderSegment(
  ctx: CanvasRenderingContext2D,
  segment: Segment,
  overlay: Overlay,
  onTick: (elapsed: number) => void,
): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const step = () => {
      const elapsed = Math.min(performance.now() - start, segment.duration);
      drawFrame(ctx, segment, elapsed, overlay);
      onTick(elapsed);
      if (elapsed >= segment.duration) {
        resolve();
        return;
      }
      setTimeout(step, 1000 / FPS);
    };
    step();
  });
}

export async function processVideoInBrowser(
  videoId: string,
  propertyId: string,
  onProgress?: (progress: VideoProgress) => void,
): Promise<void> {
  const supabase = createClient();
  const report = (progress: VideoProgress) => onProgress?.(progress);
  const objectUrls: string[] = [];
  let canvas: HTMLCanvasElement | null = null;

  try {
    report({ stage: "preparing", percent: 2, label: "Preparando las fotos…" });

    const mimeType = pickMimeType();
    if (!mimeType) {
      throw new Error("Tu navegador no permite grabar video. Prueba con Chrome o Safari actualizados.");
    }

    const { data: propertyData } = await supabase
      .from("properties")
      .select("agency_id")
      .eq("id", propertyId)
      .single();

    const { data: agencyData } = propertyData?.agency_id
      ? await supabase
          .from("agencies")
          .select("logo_url, brand_primary_color")
          .eq("id", propertyData.agency_id)
          .single()
      : { data: null };

    const brandColor: string = agencyData?.brand_primary_color ?? "#D4AF37";
    let logo: HTMLImageElement | null = null;
    if (agencyData?.logo_url) {
      try {
        logo = await loadImage(agencyData.logo_url, objectUrls);
      } catch {
        logo = null;
      }
    }

    const { data: zonesData, error: zonesError } = await supabase
      .from("property_zones")
      .select("name, room_order, property_zone_photos(photo_slot, url)")
      .eq("property_id", propertyId)
      .order("room_order", { ascending: true });

    if (zonesError) {
      throw new Error(zonesError.message);
    }

    const zones = ((zonesData ?? []) as ZoneRow[])
      .map((zone) => ({
        name: zone.name,
        photos: [...(zone.property_zone_photos ?? [])]
          .filter((photo) => Boolean(photo.url))
          .sort((a, b) => a.photo_slot - b.photo_slot)
          .slice(0, 2),
      }))
      .filter((zone) => zone.photos.length > 0);

    if (zones.length === 0) {
      throw new Error("Añade al menos una foto a una habitación antes de generar el video.");
    }

    const totalPhotos = zones.reduce((sum, zone) => sum + zone.photos.length, 0);
    const segments: Segment[] = [];
    let loaded = 0;

    for (const [zoneIndex, zone] of zones.entries()) {
      const duration = zone.photos.length > 1 ? DOUBLE_PHOTO_MS : SINGLE_PHOTO_MS;
      for (const photo of zone.photos) {
        const image = await loadImage(photo.url as string, objectUrls);
        segments.push({
          image: prerenderCover(image),
          label: zone.name,
          duration,
          zoneIndex,
          zoneCount: zones.length,
          panDirection: segments.length % 2 === 0 ? 1 : -1,
        });
        loaded += 1;
        report({
          stage: "preparing",
          percent: 2 + Math.round((loaded / totalPhotos) * 8),
          label: "Preparando las fotos…",
        });
      }
    }

    const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);

    await supabase.from("videos").update({ status: "processing" }).eq("id", videoId);

    canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.style.position = "fixed";
    canvas.style.opacity = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "-1000";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Tu navegador no permite generar el video.");
    }

    const overlay: Overlay = {
      logo,
      brandColor,
      fontFamily: getComputedStyle(document.body).fontFamily || "sans-serif",
    };

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const stream = canvas.captureStream(FPS);
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });

    recorder.start(250);

    let elapsedBefore = 0;
    for (const segment of segments) {
      await renderSegment(ctx, segment, overlay, (elapsed) => {
        const percent = 10 + Math.round(((elapsedBefore + elapsed) / totalDuration) * 80);
        report({
          stage: "recording",
          percent: Math.min(percent, 90),
          label: `Grabando ${segment.label} (${segment.zoneIndex + 1} de ${segment.zoneCount})`,
        });
      });
      elapsedBefore += segment.duration;
    }

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    await wait(250);
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());

    report({ stage: "uploading", percent: 92, label: "Guardando el video…" });

    const baseType = mimeType.split(";")[0];
    const extension = baseType === "video/mp4" ? "mp4" : "webm";
    const blob = new Blob(chunks, { type: baseType });

    if (blob.size === 0) {
      throw new Error("La grabación ha salido vacía. Inténtalo de nuevo.");
    }

    const path = `${propertyId}/${videoId}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("property-videos")
      .upload(path, blob, { cacheControl: "3600", contentType: baseType, upsert: false });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("property-videos").getPublicUrl(path);
    if (!data?.publicUrl) {
      throw new Error("No se ha podido obtener la dirección del video.");
    }

    const { error: updateError } = await supabase
      .from("videos")
      .update({ status: "completed", output_url: data.publicUrl })
      .eq("id", videoId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    report({ stage: "done", percent: 100, label: "Video listo" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se ha podido generar el video.";
    await supabase
      .from("videos")
      .update({ status: "failed", error_message: message })
      .eq("id", videoId);
    throw error instanceof Error ? error : new Error(message);
  } finally {
    if (canvas?.parentNode) canvas.parentNode.removeChild(canvas);
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }
}
