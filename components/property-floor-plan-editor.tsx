"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  createPropertyZone,
  deletePropertyZone,
  saveFloorPlan,
  updatePropertyZone,
} from "@/app/actions/property-editor";
import { createClient } from "@/lib/supabase/client";
import { PropertyZonePhotos } from "@/components/property-zone-photos";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { buttonStyles } from "@/components/panel-ui";
import type { FloorPlanZone } from "@/components/floor-plan-canvas";

const FloorPlanCanvas = dynamic(() => import("@/components/floor-plan-canvas"), { ssr: false });

type Zone = FloorPlanZone;

type PropertyFloorPlanEditorProps = {
  propertyId: string;
  initialFloorPlanUrl: string | null;
  initialZones: Zone[];
};

const STAGE_WIDTH = 1000;
const STAGE_HEIGHT = 700;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const cardClass =
  "min-w-0 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-6";

const normalizePoints = (points?: number[]) => {
  if (!points || points.length < 6 || points.length % 2 !== 0) {
    return [160, 160, 360, 160, 360, 260, 160, 260];
  }

  return points.map((point) => Number(point));
};

const createDefaultPolygonPoints = (pointerX: number, pointerY: number) => {
  const halfWidth = 80;
  const halfHeight = 55;
  return [
    clamp(pointerX - halfWidth, 0, STAGE_WIDTH), clamp(pointerY - halfHeight, 0, STAGE_HEIGHT),
    clamp(pointerX + halfWidth, 0, STAGE_WIDTH), clamp(pointerY - halfHeight, 0, STAGE_HEIGHT),
    clamp(pointerX + halfWidth, 0, STAGE_WIDTH), clamp(pointerY + halfHeight, 0, STAGE_HEIGHT),
    clamp(pointerX - halfWidth, 0, STAGE_WIDTH), clamp(pointerY + halfHeight, 0, STAGE_HEIGHT),
  ];
};

function TrashIcon({ className = "h-5 w-5" }: { className?: string }) {
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

export function PropertyFloorPlanEditor({
  propertyId,
  initialFloorPlanUrl,
  initialZones,
}: PropertyFloorPlanEditorProps) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [floorPlanUrl, setFloorPlanUrl] = useState(initialFloorPlanUrl);
  const [planImage, setPlanImage] = useState<HTMLImageElement | null>(null);
  const [zones, setZones] = useState<Zone[]>(
    initialZones.map((zone) => ({ ...zone, points: normalizePoints(zone.points) })),
  );
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const editingZoneIdRef = useRef<string | null>(null);
  const savedWhileEditingRef = useRef(false);

  // Mientras se ajustan esquinas se guarda en silencio; el aviso sale al salir del modo edición.
  useEffect(() => {
    const wasEditing = editingZoneIdRef.current;
    editingZoneIdRef.current = editingZoneId;
    if (wasEditing && !editingZoneId && savedWhileEditingRef.current) {
      savedWhileEditingRef.current = false;
      setMessage("Cambios guardados.");
    }
  }, [editingZoneId]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 2500);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [floorPlanUrl]);

  useEffect(() => {
    if (!floorPlanUrl) {
      setPlanImage(null);
      return;
    }

    let cancelled = false;
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (!cancelled) setPlanImage(image);
    };
    image.onerror = () => {
      if (!cancelled) setError("No se pudo cargar la imagen del plano.");
    };
    image.src = floorPlanUrl;

    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [floorPlanUrl]);

  const persistZonePoints = async (zoneId: string, points: number[]) => {
    try {
      const updatedZone = await updatePropertyZone(propertyId, zoneId, { points });
      setZones((currentZones) =>
        currentZones.map((zone) =>
          zone.id === zoneId ? { ...zone, ...updatedZone, photos: zone.photos } : zone,
        ),
      );
      if (editingZoneIdRef.current) {
        savedWhileEditingRef.current = true;
      } else {
        setMessage("Cambios guardados.");
      }
    } catch (zoneError) {
      setError(zoneError instanceof Error ? zoneError.message : "No se pudo guardar la habitación.");
    }
  };

  const updateZonePointsLocally = (zoneId: string, points: number[]) => {
    setZones((currentZones) =>
      currentZones.map((zone) => (zone.id === zoneId ? { ...zone, points } : zone)),
    );
  };

  const uploadFloorPlan = async (file: File) => {
    const extension = (file.name.split(".").pop() ?? "png").toLowerCase();
    const allowedExtensions = ["png", "jpg", "jpeg", "webp"];

    if (!allowedExtensions.includes(extension)) {
      throw new Error("El plano debe estar en formato PNG, JPG o WEBP.");
    }

    const supabase = createClient();
    const path = `properties/${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("floor-plans").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || `image/${extension === "jpg" || extension === "jpeg" ? "jpeg" : extension}`,
      upsert: false,
    });

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage.from("floor-plans").getPublicUrl(path);
    if (!data?.publicUrl) throw new Error("No se pudo obtener la URL pública del plano.");
    return data.publicUrl;
  };

  const handlePlanSelected = async (file?: File) => {
    if (!file) return;

    setError("");
    setMessage("");
    setIsUploading(true);

    try {
      const publicUrl = await uploadFloorPlan(file);
      await saveFloorPlan(propertyId, publicUrl);
      setFloorPlanUrl(publicUrl);
      setMessage("Plano guardado.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir el plano.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCanvasStageClick = async (pointerX: number, pointerY: number, currentZoneCount: number) => {
    setSelectedZoneId(null);
    setEditingZoneId(null);
    if (!floorPlanUrl) return;

    const newPoints = createDefaultPolygonPoints(pointerX, pointerY);
    const name = `Habitación ${currentZoneCount + 1}`;
    const roomOrder = currentZoneCount + 1;
    const tempId = `temp-${Date.now()}`;
    setZones((prev) => [
      ...prev,
      {
        id: tempId,
        property_id: propertyId,
        name,
        points: newPoints,
        room_order: roomOrder,
        photos: [],
      },
    ]);
    setSelectedZoneId(tempId);

    try {
      setError("");
      const created = await createPropertyZone(propertyId, {
        name,
        roomOrder,
        points: newPoints,
      });
      setZones((prev) => prev.map((zone) => (zone.id === tempId ? { ...created, points: newPoints, photos: [] } : zone)));
      setSelectedZoneId((currentId) => (currentId === tempId ? created.id : currentId));
      setMessage("Habitación añadida.");
    } catch (zoneError) {
      setZones((prev) => prev.filter((zone) => zone.id !== tempId));
      setSelectedZoneId((currentId) => (currentId === tempId ? null : currentId));
      setError(zoneError instanceof Error ? zoneError.message : "No se pudo crear la habitación.");
    }
  };

  const handleZoneUpdate = async (zone: Zone, name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setError("");
    try {
      const updatedZone = await updatePropertyZone(propertyId, zone.id, {
        name: trimmedName,
        roomOrder: zone.room_order,
        points: zone.points,
      });
      setZones((currentZones) =>
        currentZones.map((currentZone) =>
          currentZone.id === zone.id
            ? { ...currentZone, ...updatedZone, photos: currentZone.photos, name: trimmedName }
            : currentZone,
        ),
      );
      setMessage("Nombre guardado.");
    } catch (zoneError) {
      setError(zoneError instanceof Error ? zoneError.message : "No se pudo guardar el nombre.");
    }
  };

  const handleZoneDelete = async (zoneId: string) => {
    setError("");
    try {
      await deletePropertyZone(propertyId, zoneId);
      setZones((currentZones) =>
        currentZones
          .filter((zone) => zone.id !== zoneId)
          .map((zone, index) => ({ ...zone, room_order: index + 1 })),
      );
      setSelectedZoneId((currentId) => (currentId === zoneId ? null : currentId));
      setEditingZoneId((currentId) => (currentId === zoneId ? null : currentId));
      setMessage("Habitación eliminada.");
    } catch (zoneError) {
      setError(zoneError instanceof Error ? zoneError.message : "No se pudo eliminar la habitación.");
    }
  };

  const handleZoneSelect = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setEditingZoneId(null);
  };

  const handleZoneEdit = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setEditingZoneId(zoneId);
  };

  const sortedZones = [...zones].sort((first, second) => first.room_order - second.room_order);

  return (
    <div className="space-y-4">
      {error || message ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[65] flex justify-center px-4 md:bottom-8">
          <p
            role={error ? "alert" : "status"}
            className={`page-enter pointer-events-auto max-w-md rounded-full px-5 py-2.5 text-center text-sm font-medium text-white shadow-lg ${
              error ? "bg-red-600" : "bg-[#0F172A]"
            }`}
          >
            {error || message}
          </p>
        </div>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className={cardClass}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#0F172A]">Plano</h2>
              <p className="mt-1 text-sm text-pretty text-[#6B7280]">
                {floorPlanUrl
                  ? "Toca o haz clic en una zona vacía del plano para marcar una habitación. Selecciónala y arrástrala para moverla. Con doble toque o doble clic cambias su tamaño desde las esquinas doradas; los puntos blancos añaden una esquina nueva para habitaciones en forma de L."
                  : "Sube el plano de la vivienda para empezar a marcar las habitaciones."}
              </p>
            </div>
            {floorPlanUrl ? (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploading}
                className={`${buttonStyles.secondary} shrink-0 disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {isUploading ? "Subiendo…" : "Cambiar plano"}
              </button>
            ) : null}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                void handlePlanSelected(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>

          {floorPlanUrl ? (
            <div className="mt-5 overflow-hidden rounded-xl border border-black/[0.06] bg-[#F1F1F1]">
              <div
                ref={containerRef}
                className="relative w-full"
                style={{ aspectRatio: `${STAGE_WIDTH} / ${STAGE_HEIGHT}` }}
              >
                {size.width > 0 && size.height > 0 ? (
                  <FloorPlanCanvas
                    size={size}
                    planImage={planImage}
                    zones={zones}
                    selectedZoneId={selectedZoneId}
                    editingZoneId={editingZoneId}
                    onStageClick={handleCanvasStageClick}
                    onSelectZone={handleZoneSelect}
                    onEditZone={handleZoneEdit}
                    onZonePointsChange={updateZonePointsLocally}
                    onUpdateZonePoints={persistZonePoints}
                    onDeselect={() => {
                      setSelectedZoneId(null);
                      setEditingZoneId(null);
                    }}
                  />
                ) : null}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploading}
              className="mt-5 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-6 py-16 text-center transition-colors hover:border-[#D4AF37] disabled:opacity-60"
            >
              <span className="text-base font-semibold text-[#0F172A]">
                {isUploading ? "Subiendo plano…" : "Subir plano"}
              </span>
              <span className="mt-1 text-sm text-[#6B7280]">PNG, JPG o WEBP</span>
            </button>
          )}
        </section>

        {floorPlanUrl ? (
          <section className={cardClass}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[#0F172A]">Habitaciones</h2>
                <p className="mt-1 text-sm text-pretty text-[#6B7280]">
                  El video las recorre en este orden. Sube hasta 2 fotos de cada una.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[#F1F1F1] px-3 py-1 text-sm font-medium tabular-nums text-[#0F172A]">
                {zones.length}
              </span>
            </div>

            {sortedZones.length ? (
              <div className="space-y-3">
                {sortedZones.map((zone) => (
                  <ZoneEditor key={zone.id} zone={zone} onSave={handleZoneUpdate} onDelete={handleZoneDelete} />
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-[#FAFAFA] p-4 text-sm text-[#6B7280]">
                Todavía no hay habitaciones. Haz clic sobre el plano para marcar la primera.
              </p>
            )}

            {sortedZones.length ? (
              <Link href={`/properties/${propertyId}/video`} className={`${buttonStyles.primary} mt-5 w-full`}>
                Siguiente: crear video
              </Link>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}

function ZoneEditor({
  zone,
  onSave,
  onDelete,
}: {
  zone: Zone;
  onSave: (zone: Zone, name: string) => Promise<void>;
  onDelete: (zoneId: string) => Promise<void>;
}) {
  const [name, setName] = useState(zone.name);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isSaving = zone.id.startsWith("temp-");
  const skipBlurRef = useRef(false);

  useEffect(() => {
    setName(zone.name);
  }, [zone.name]);

  const commitName = () => {
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      setName(zone.name);
      return;
    }
    if (trimmed !== zone.name) {
      void onSave(zone, trimmed);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(zone.id);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0F172A] text-sm font-semibold text-white">
          {zone.room_order}
        </span>
        <input
          aria-label="Nombre de la habitación"
          value={name}
          disabled={isSaving}
          onChange={(event) => setName(event.target.value)}
          onBlur={commitName}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              skipBlurRef.current = true;
              setName(zone.name);
              event.currentTarget.blur();
            }
          }}
          className="min-w-0 flex-1 rounded-xl border border-transparent bg-[#FAFAFA] px-3 py-2 text-base font-medium text-[#0F172A] outline-none transition hover:border-[#E5E7EB] focus:border-[#D4AF37] focus:bg-white focus:ring-2 focus:ring-[#D4AF37]/30 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={isSaving}
          aria-label={`Eliminar ${zone.name}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#9CA3AF] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
        >
          <TrashIcon />
        </button>
      </div>

      <div className="mt-4">
        {isSaving ? (
          <p className="rounded-xl bg-[#FAFAFA] p-4 text-center text-xs text-[#9CA3AF]">Guardando habitación…</p>
        ) : (
          <PropertyZonePhotos propertyId={zone.property_id} zoneId={zone.id} photos={zone.photos ?? []} />
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        busy={deleting}
        title={`¿Eliminar «${zone.name}»?`}
        description="Se quitará del plano y del recorrido del video, junto con sus fotos."
        onConfirm={() => {
          void confirmDelete();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
