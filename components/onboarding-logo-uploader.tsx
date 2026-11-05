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

export function OnboardingLogoUploader({ initialLogoUrl }: { initialLogoUrl?: string }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialLogoUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
      setUploadError("Formato no válido. Usa una imagen PNG, JPG o WEBP.");
      return;
    }

    setUploadError(null);
    setSelectedFile(normalizedFile);
    setPreviewUrl(URL.createObjectURL(normalizedFile));

    try {
      setIsUploading(true);
      const publicUrl = await uploadLogoToSupabase(normalizedFile);
      setLogoUrl(publicUrl);
    } catch (error) {
      console.error("Error subiendo el logo:", error);
      setUploadError("No se ha podido subir el logo. Inténtalo de nuevo.");
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
      <label className="mb-2 block text-sm font-medium text-[#6B7280]">Logo de la agencia</label>

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
          isDragging ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB] bg-[#FAFAFA]"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview del logo" className="h-24 w-24 rounded-xl object-contain" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#F1F1F1] text-2xl">
              🖼️
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-[#0F172A]">
              Arrastra aquí tu logo, pégalo o sube uno desde tu dispositivo
            </p>
            <p className="mt-1 text-xs text-[#6B7280]">PNG con fondo transparente para mejor resultado en los videos</p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full bg-[#0F172A] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1E293B]"
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
        <input type="hidden" name="logoUrl" value={logoUrl} />
      </div>

      {uploadError ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {uploadError}
        </p>
      ) : null}

      {selectedFile ? (
        <p className="mt-3 text-xs text-[#6B7280]">
          {isUploading ? "Subiendo logo…" : "Logo listo. Guarda los cambios para aplicarlo."}
        </p>
      ) : null}
    </div>
  );
}
