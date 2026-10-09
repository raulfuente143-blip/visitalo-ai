"use client";

import { createClient } from "@/lib/supabase/client";

async function loadImageAsBase64(url: string): Promise<HTMLImageElement> {
  const response = await fetch(url);
  const blob = await response.blob();
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base64;
  });
}

export async function processVideoInBrowser(
  videoId: string,
  propertyId: string,
): Promise<void> {
  console.log("[video] Iniciando procesamiento", { videoId, propertyId });
  const supabase = createClient();

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
  const brandColor = agencyData?.brand_primary_color ?? "#FF6B4A";

  let logoImage: HTMLImageElement | null = null;

  if (agencyData?.logo_url) {
    try {
      logoImage = await loadImageAsBase64(agencyData.logo_url);
    } catch {
      logoImage = null;
    }
  }

  const { data: zones, error: zonesError } = await supabase
    .from("property_zones")
    .select("name, room_order, property_zone_photos(photo_slot, url)")
    .eq("property_id", propertyId)
    .order("room_order", { ascending: true });

  console.log("[video] Zonas obtenidas:", zones?.length, zones?.map((z) => z.name));

  if (zonesError) {
    throw new Error(zonesError.message);
  }

  const zonesWithPhoto = (zones ?? []).filter(
    (zone) => (zone.property_zone_photos ?? []).some((photo) => photo.photo_slot === 1),
  );

  if (zonesWithPhoto.length === 0) {
    throw new Error("No hay fotos disponibles para generar el video.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  canvas.style.position = "fixed";
  canvas.style.opacity = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "-1000";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const mimeType = MediaRecorder.isTypeSupported("video/mp4;codecs=avc3")
    ? "video/mp4;codecs=avc3"
    : MediaRecorder.isTypeSupported("video/mp4")
      ? "video/mp4"
      : "video/webm;codecs=vp9";

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => chunks.push(event.data);
  console.log("[video] MediaRecorder preparado, mimeType:", recorder.mimeType);

  const drawFramesForZone = (
    image: HTMLImageElement,
    zoneName: string,
    durationMs: number,
    logo: HTMLImageElement | null,
    brandColor: string,
  ): Promise<void> => {
    return new Promise((resolve) => {
      const fps = 30;
      const totalFrames = Math.floor((durationMs / 1000) * fps);
      let frame = 0;

      const drawNextFrame = () => {
        const progress = frame / totalFrames;
        const scale = 1 + progress * 0.05;
        const offsetX = progress * -20;
        const drawWidth = canvas.width * scale;
        const drawHeight = canvas.height * scale;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, offsetX, 0, drawWidth, drawHeight);

        // Fondo semitransparente detrás del logo arriba izquierda
        if (logo) {
          const maxSize = 120;
          const ratio = logo.width / logo.height;
          const logoW = ratio >= 1 ? maxSize : maxSize * ratio;
          const logoH = ratio >= 1 ? maxSize / ratio : maxSize;
          ctx.globalAlpha = 0.92;
          ctx.drawImage(logo, 20, 20, logoW, logoH);
          ctx.globalAlpha = 1;
        }

        const barHeight = 56;
        const barY = canvas.height - barHeight;

        // Fondo sólido semitransparente que siempre contrasta
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, barY, canvas.width, barHeight);

        // Línea del color de marca
        ctx.fillStyle = brandColor;
        ctx.fillRect(0, barY, canvas.width, 4);

        // Nombre centrado en blanco
        ctx.fillStyle = "white";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(zoneName, canvas.width / 2, barY + barHeight / 2 + 4);

        // Marca de agua a la derecha
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText("visitalo.ai", canvas.width - 20, barY + barHeight / 2 + 4);

        frame++;
        if (frame <= totalFrames) {
          setTimeout(drawNextFrame, 1000 / fps);
        } else {
          resolve();
        }
      };

      drawNextFrame();
    });
  };

  const fadeToBlack = (fadeDurationMs: number): Promise<void> => {
    return new Promise((resolve) => {
      const fps = 30;
      const totalFrames = Math.floor((fadeDurationMs / 1000) * fps);
      let frame = 0;

      const drawFade = () => {
        const progress = frame / totalFrames;
        ctx.fillStyle = `rgba(0,0,0,${progress})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        frame++;

        if (frame <= totalFrames) {
          setTimeout(drawFade, 1000 / fps);
        } else {
          resolve();
        }
      };

      drawFade();
    });
  };

  try {
    console.log("[video] Procesando", zonesWithPhoto.length, "zonas");

    const firstZone = zonesWithPhoto[0];
    const firstPhoto = firstZone?.property_zone_photos?.find((item) => item.photo_slot === 1);
    if (!firstZone || !firstPhoto?.url) {
      throw new Error("No hay una foto disponible para iniciar la grabación.");
    }

    console.log("[video] Zona:", firstZone.name, "foto:", firstPhoto.url);
    const firstImage = await loadImageAsBase64(firstPhoto.url);

    ctx.drawImage(firstImage, 0, 0, canvas.width, canvas.height);
    recorder.start(100);

    for (const [index, zone] of zonesWithPhoto.entries()) {
      const foto1 = zone.property_zone_photos?.find((photo) => photo.photo_slot === 1);
      const foto2 = zone.property_zone_photos?.find((photo) => photo.photo_slot === 2);

      if (!foto1?.url) continue;

      console.log("[video] Zona:", zone.name, "foto 1:", foto1.url, "foto 2:", foto2?.url ?? null);

      await supabase
        .from("videos")
        .update({ status: "processing" })
        .eq("id", videoId);

      const img1 = await loadImageAsBase64(foto1.url);
      await drawFramesForZone(img1, zone.name, foto2 ? 2000 : 3000, logoImage, brandColor);

      if (foto2) {
        await fadeToBlack(300);
        const img2 = await loadImageAsBase64(foto2.url);
        await drawFramesForZone(img2, zone.name, 1500, logoImage, brandColor);
      }

      if (index !== zonesWithPhoto.length - 1) {
        await fadeToBlack(500);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    recorder.stop();
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });
    document.body.removeChild(canvas);
    console.log("[video] Grabación detenida, chunks:", chunks.length, "tamaño total:", chunks.reduce((a, b) => a + b.size, 0));

    const extension = mimeType.includes("mp4") ? "mp4" : "webm";
    const blob = new Blob(chunks, { type: mimeType });
    const file = new File([blob], `video-${videoId}.${extension}`, { type: mimeType });
    const path = `${propertyId}/${videoId}.${extension}`;

    console.log("[video] Subiendo blob a Storage...");
    const { error: uploadError } = await supabase.storage
      .from("property-videos")
      .upload(path, file, {
        cacheControl: "3600",
        contentType: "video/webm",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("property-videos").getPublicUrl(path);
    const publicUrl = data?.publicUrl;
    if (!publicUrl) {
      throw new Error("No se pudo obtener la URL pública del video.");
    }
    console.log("[video] Subida completada, url:", publicUrl);

    const { error: updateError } = await supabase
      .from("videos")
      .update({ status: "completed", output_url: publicUrl })
      .eq("id", videoId);

    console.log("[video] Status actualizado a completed en Supabase");

    if (updateError) {
      throw new Error(updateError.message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo procesar el video.";
    await supabase
      .from("videos")
      .update({ status: "failed", error_message: message })
      .eq("id", videoId);
    throw error;
  }
}
