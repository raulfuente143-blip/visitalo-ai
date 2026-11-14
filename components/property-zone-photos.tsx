"use client";

import { useRef, useState } from "react";
import {
  deletePropertyZonePhoto,
  savePropertyZonePhoto,
} from "@/app/actions/property-editor";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/confirm-dialog";

type ZonePhoto = {
  id: string;
  zone_id: string;
  photo_slot: 1 | 2;
  url: string;
};

function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m6 6 1 14h10l1-14" />
    </svg>
  );
}

export function PropertyZonePhotos({
  propertyId,
  zoneId,
  photos,
}: {
  propertyId: string;
  zoneId: string;
  photos: ZonePhoto[];
}) {
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [currentPhotos, setCurrentPhotos] = useState(photos);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [photoToRemove, setPhotoToRemove] = useState<ZonePhoto | null>(null);
  const [removing, setRemoving] = useState(false);

  const uploadPhoto = async (file: File, slot: 1 | 2) => {
    const extension = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    if (!["png", "jpg", "jpeg", "webp"].includes(extension)) {
      throw new Error("Las fotos deben estar en formato PNG, JPG o WEBP.");
    }

    const supabase = createClient();
    const path = `properties/${propertyId}/${zoneId}/${slot}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("property-photos").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || `image/${extension === "jpg" || extension === "jpeg" ? "jpeg" : extension}`,
      upsert: false,
    });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("property-photos").getPublicUrl(path);

    if (!data?.publicUrl) {
      throw new Error("No se pudo obtener la URL pública de la foto.");
    }

    return data.publicUrl;
  };

  const handleSelected = async (file: File | undefined, slot: 1 | 2) => {
    if (!file) return;

    setError("");
    setUploadingSlot(slot);
    try {
      const url = await uploadPhoto(file, slot);
      const savedPhoto = await savePropertyZonePhoto(propertyId, zoneId, slot, url);
      setCurrentPhotos((existingPhotos) => [
        ...existingPhotos.filter((photo) => photo.photo_slot !== slot),
        savedPhoto,
      ]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo guardar la foto.");
    } finally {
      setUploadingSlot(null);
    }
  };

  const confirmRemove = async () => {
    if (!photoToRemove) return;
    setError("");
    setRemoving(true);
    try {
      await deletePropertyZonePhoto(propertyId, zoneId, photoToRemove.id);
      setCurrentPhotos((existingPhotos) => existingPhotos.filter((item) => item.id !== photoToRemove.id));
      setPhotoToRemove(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo quitar la foto.");
      setPhotoToRemove(null);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {([1, 2] as const).map((slot) => {
          const photo = currentPhotos.find((item) => item.photo_slot === slot);
          const isUploading = uploadingSlot === slot;

          return (
            <div key={slot} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#FAFAFA]">
              {photo ? (
                <>
                  <img src={photo.url} alt={`Foto ${slot} de la habitación`} className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/60 to-transparent p-2 pt-8">
                    <button
                      type="button"
                      onClick={() => inputRefs.current[slot]?.click()}
                      disabled={isUploading}
                      className="flex-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-[#0F172A] backdrop-blur transition-colors hover:bg-white disabled:opacity-60"
                    >
                      {isUploading ? "Subiendo…" : "Cambiar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoToRemove(photo)}
                      disabled={isUploading}
                      aria-label={`Quitar foto ${slot}`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/90 text-red-600 backdrop-blur transition-colors hover:bg-white disabled:opacity-60"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRefs.current[slot]?.click()}
                  disabled={isUploading}
                  className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#E5E7EB] text-[#6B7280] transition-colors hover:border-[#D4AF37] hover:text-[#0F172A] disabled:opacity-60"
                >
                  <span className="text-2xl leading-none">{isUploading ? "…" : "+"}</span>
                  <span className="text-xs font-medium">{isUploading ? "Subiendo…" : `Foto ${slot}`}</span>
                </button>
              )}
              <input
                ref={(element) => {
                  inputRefs.current[slot] = element;
                }}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                  void handleSelected(event.target.files?.[0], slot);
                  event.target.value = "";
                }}
              />
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-[#9CA3AF]">Hasta 2 fotos. Con una ya aparece en el video.</p>
      {error ? (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <ConfirmDialog
        open={Boolean(photoToRemove)}
        busy={removing}
        title="¿Quitar esta foto?"
        description="Se borrará la foto de esta habitación. Podrás subir otra cuando quieras."
        confirmLabel="Quitar"
        onConfirm={() => {
          void confirmRemove();
        }}
        onCancel={() => setPhotoToRemove(null)}
      />
    </div>
  );
}
