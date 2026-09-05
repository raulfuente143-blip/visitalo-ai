"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const acceptedTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
] as const;

function normalizeImageFile(file: File) {
  const extension = (file.name.split(".").pop() ?? "png").toLowerCase();
  const extensionMimeMap: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    svg: "image/svg+xml",
    gif: "image/gif",
  };

  const mimeType = acceptedTypes.includes(file.type as (typeof acceptedTypes)[number])
    ? file.type
    : extensionMimeMap[extension] ?? "image/png";

  const normalizedFile = new File([file], file.name, {
    type: mimeType,
    lastModified: file.lastModified,
  });

  return normalizedFile;
}

export function OnboardingLogoUploader() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadLogoToSupabase = async (file: File) => {
    const supabase = createClient();
    const normalizedFile = normalizeImageFile(file);
    const extension = (normalizedFile.name.split(".").pop() ?? "png").toLowerCase();
    const safeFileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(`agency-logos/${safeFileName}`, normalizedFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: normalizedFile.type,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("logos").getPublicUrl(`agency-logos/${safeFileName}`);

    return publicUrl;
  };

  const handleFileSelection = async (file?: File | null) => {
    if (!file) {
      return;
    }

    const normalizedFile = normalizeImageFile(file);
    const allowedMimeTypes = new Set(acceptedTypes);
    const mimeType = normalizedFile.type || "";
    const extension = (normalizedFile.name.split(".").pop() ?? "").toLowerCase();
    const isAllowed = allowedMimeTypes.has(mimeType as (typeof acceptedTypes)[number]) || ["png", "jpg", "jpeg", "webp"].includes(extension);

    if (!isAllowed) {
      alert("Formato de imagen no soportado. Usa PNG, JPG o WEBP.");
      return;
    }

    setSelectedFile(normalizedFile);
    setPreviewUrl(URL.createObjectURL(normalizedFile));

    try {
      setIsUploading(true);
      const publicUrl = await uploadLogoToSupabase(normalizedFile);
      const hiddenInput = document.querySelector<HTMLInputElement>('input[name="logoUrl"]');
      if (hiddenInput) {
        hiddenInput.value = publicUrl;
      }
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const pastedFile = event.clipboardData?.files?.[0];

    if (pastedFile) {
      event.preventDefault();
      handleFileSelection(pastedFile);
    }
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">Logo de la agencia</label>

      <div
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFileSelection(event.dataTransfer.files?.[0]);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onPaste={handlePaste}
        className={`rounded-2xl border-2 border-dashed p-5 transition ${
          isDragging ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-slate-50"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview del logo" className="h-24 w-24 rounded-xl object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-200 text-2xl">
              🖼️
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-slate-700">
              Arrastra aquí tu logo, pégalo o sube uno desde tu dispositivo
            </p>
            <p className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP, SVG o GIF</p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Elegir archivo
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
          className="hidden"
          name="logoFile"
          onChange={(event) => handleFileSelection(event.target.files?.[0])}
        />
        <input type="hidden" name="logoUrl" value="" />
      </div>

      {selectedFile ? (
        <p className="mt-3 text-xs text-slate-500">
          {isUploading ? "Subiendo al bucket logos..." : "La imagen está lista para adjuntarse al onboarding."}
        </p>
      ) : null}
    </div>
  );
}
