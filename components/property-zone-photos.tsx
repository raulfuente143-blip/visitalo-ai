"use client";

import { useRef, useState } from "react";
import {
  deletePropertyZonePhoto,
  savePropertyZonePhoto,
} from "@/app/actions/property-editor";
import { createClient } from "@/lib/supabase/client";

type ZonePhoto = {
  id: string;
  zone_id: string;
  photo_slot: 1 | 2;
  url: string;
};

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

  const removePhoto = async (photo: ZonePhoto) => {
    setError("");
    try {
      await deletePropertyZonePhoto(propertyId, zoneId, photo.id);
      setCurrentPhotos((existingPhotos) => existingPhotos.filter((item) => item.id !== photo.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar la foto.");
    }
  };

  return (
    <div className="mt-4 rounded-xl bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Fotos de la habitación</p>
          <p className="mt-1 text-xs text-slate-500">Sube exactamente 2 fotos para esta zona.</p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
          {currentPhotos.length}/2
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2].map((slot) => {
          const photo = currentPhotos.find((item) => item.photo_slot === slot);
          const isUploading = uploadingSlot === slot;

          return (
            <div key={slot} className="rounded-lg border border-slate-200 bg-white p-3">
              {photo ? (
                <img src={photo.url} alt={`Foto ${slot} de la habitación`} className="h-32 w-full rounded-md object-cover" />
              ) : (
                <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-slate-300 text-xs text-slate-500">
                  Slot {slot} vacío
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => inputRefs.current[slot]?.click()}
                  disabled={isUploading}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {isUploading ? "Subiendo..." : photo ? "Cambiar" : `Subir foto ${slot}`}
                </button>
                {photo ? (
                  <button
                    type="button"
                    onClick={() => removePhoto(photo)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                ) : null}
              </div>
              <input
                ref={(element) => {
                  inputRefs.current[slot] = element;
                }}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => handleSelected(event.target.files?.[0], slot as 1 | 2)}
              />
            </div>
          );
        })}
      </div>

      {error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}