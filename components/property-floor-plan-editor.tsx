"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  createPropertyZone,
  deletePropertyZone,
  saveFloorPlan,
  updatePropertyZone,
} from "@/app/actions/property-editor";
import { createClient } from "@/lib/supabase/client";
import { PropertyZonePhotos } from "@/components/property-zone-photos";
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
      setMessage("Zona guardada.");
    } catch (zoneError) {
      setError(zoneError instanceof Error ? zoneError.message : "No se pudo guardar la zona.");
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
      setMessage("Plano guardado correctamente.");
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
      setZones((prev) => prev.map((zone) => zone.id === tempId ? { ...created, points: newPoints, photos: [] } : zone));
      setSelectedZoneId((currentId) => currentId === tempId ? created.id : currentId);
      setMessage("Nueva zona creada.");
    } catch (zoneError) {
      setZones((prev) => prev.filter((zone) => zone.id !== tempId));
      setSelectedZoneId((currentId) => currentId === tempId ? null : currentId);
      setError(zoneError instanceof Error ? zoneError.message : "No se pudo crear la zona.");
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
      setMessage("Zona actualizada.");
    } catch (zoneError) {
      setError(zoneError instanceof Error ? zoneError.message : "No se pudo actualizar la zona.");
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
      setMessage("Zona eliminada. El orden se recalcula automáticamente.");
    } catch (zoneError) {
      setError(zoneError instanceof Error ? zoneError.message : "No se pudo eliminar la zona.");
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

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Plano de la propiedad</h2>
            <p className="mt-1 text-sm text-slate-500">
              Sube el plano y haz clic en un punto para crear una zona. Selecciónala para moverla o haz doble clic para editar sus vértices.
            </p>
          </div>
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploading}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? "Subiendo..." : floorPlanUrl ? "Cambiar plano" : "Subir plano"}
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => handlePlanSelected(event.target.files?.[0])}
          />
        </div>

        {floorPlanUrl ? (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
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
                />
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <p className="font-medium text-slate-700">Aún no hay un plano subido</p>
            <p className="mt-1 text-sm text-slate-500">Acepta PNG, JPG y WEBP.</p>
          </div>
        )}
      </section>

      {floorPlanUrl ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Zonas y recorrido</h2>
              <p className="mt-1 text-sm text-slate-500">
                El orden de cada habitación se asigna automáticamente y se recalcula al eliminar zonas.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              {zones.length} zonas
            </span>
          </div>

          {zones.length ? (
            <div className="space-y-3">
              {[...zones]
                .sort((first, second) => first.room_order - second.room_order)
                .map((zone) => (
                  <ZoneEditor key={zone.id} zone={zone} onSave={handleZoneUpdate} onDelete={handleZoneDelete} />
                ))}
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              Todavía no hay zonas. Haz clic sobre el plano para crear la primera habitación.
            </p>
          )}
        </section>
      ) : null}

      {message ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
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

  useEffect(() => {
    setName(zone.name);
  }, [zone.name]);

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_auto_auto] md:items-end">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Nombre</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
        />
      </div>
      <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
        Orden: {zone.room_order}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave(zone, name)}
          className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={() => onDelete(zone.id)}
          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
        >
          Eliminar
        </button>
      </div>
      <div className="md:col-span-3">
        <PropertyZonePhotos propertyId={zone.property_id} zoneId={zone.id} photos={zone.photos ?? []} />
      </div>
    </div>
  );
}
