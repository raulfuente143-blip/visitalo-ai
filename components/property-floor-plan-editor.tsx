"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Circle, Text, Group } from "react-konva";
import { createPropertyZone, deletePropertyZone, saveFloorPlan, updatePropertyZone } from "@/app/actions/property-editor";
import { createClient } from "@/lib/supabase/client";
import { PropertyZonePhotos } from "@/components/property-zone-photos";

type Zone = {
  id: string;
  property_id: string;
  name: string;
  room_order: number;
  points: number[];
  photos?: {
    id: string;
    zone_id: string;
    photo_slot: 1 | 2;
    url: string;
  }[];
};

type PropertyFloorPlanEditorProps = {
  propertyId: string;
  initialFloorPlanUrl: string | null;
  initialZones: Zone[];
};

const STAGE_WIDTH = 1000;
const STAGE_HEIGHT = 700;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalizePoints = (points?: number[]) => {
  if (!points || points.length !== 8) {
    return [160, 160, 360, 160, 360, 260, 160, 260];
  }

  return points.map((point) => Number(point));
};

const createDefaultPolygonPoints = (pointerX: number, pointerY: number) => {
  const halfWidth = 80;
  const halfHeight = 55;
  const x1 = clamp(pointerX - halfWidth, 0, STAGE_WIDTH);
  const y1 = clamp(pointerY - halfHeight, 0, STAGE_HEIGHT);
  const x2 = clamp(pointerX + halfWidth, 0, STAGE_WIDTH);
  const y2 = clamp(pointerY - halfHeight, 0, STAGE_HEIGHT);
  const x3 = clamp(pointerX + halfWidth, 0, STAGE_WIDTH);
  const y3 = clamp(pointerY + halfHeight, 0, STAGE_HEIGHT);
  const x4 = clamp(pointerX - halfWidth, 0, STAGE_WIDTH);
  const y4 = clamp(pointerY + halfHeight, 0, STAGE_HEIGHT);

  return [x1, y1, x2, y2, x3, y3, x4, y4];
};

export function PropertyFloorPlanEditor({
  propertyId,
  initialFloorPlanUrl,
  initialZones,
}: PropertyFloorPlanEditorProps) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const stageRef = useRef<any>(null);

  const [floorPlanUrl, setFloorPlanUrl] = useState(initialFloorPlanUrl);
  const [zones, setZones] = useState<Zone[]>(
    initialZones.map((zone) => ({
      ...zone,
      points: normalizePoints(zone.points),
    })),
  );
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const persistZoneGeometry = async (zoneId: string, updates: Partial<Zone>) => {
    const zoneToPersist = zones.find((zone) => zone.id === zoneId);
    if (!zoneToPersist) return;

    try {
      const updatedZone = await updatePropertyZone(propertyId, zoneId, {
        name: updates.name ?? zoneToPersist.name,
        roomOrder: updates.room_order ?? zoneToPersist.room_order,
        points: updates.points ?? zoneToPersist.points,
      });

      setZones((currentZones) =>
        currentZones.map((currentZone) =>
          currentZone.id === zoneId ? { ...currentZone, ...updatedZone, photos: currentZone.photos } : currentZone,
        ),
      );
      setMessage("Zona guardada.");
    } catch (zoneError) {
      setError(zoneError instanceof Error ? zoneError.message : "No se pudo guardar la zona.");
    }
  };

  const updateZonePoints = async (zoneId: string, nextPoints: number[]) => {
    setZones((currentZones) =>
      currentZones.map((zone) =>
        zone.id === zoneId ? { ...zone, points: nextPoints } : zone,
      ),
    );

    await persistZoneGeometry(zoneId, {
      points: nextPoints,
    });
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

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("floor-plans").getPublicUrl(path);

    if (!data?.publicUrl) {
      throw new Error("No se pudo obtener la URL pública del plano.");
    }

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

  const handleStageMouseDown = async (event: any) => {
    const stage = event.target.getStage();
    if (event.target !== stage) {
      return;
    }

    setSelectedZoneId(null);
    setEditingZoneId(null);

    if (!floorPlanUrl) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) {
      return;
    }

    const nextPoints = createDefaultPolygonPoints(pointer.x, pointer.y);
    const nextZone = {
      name: `Habitación ${zones.length + 1}`,
      roomOrder: zones.length + 1,
      points: nextPoints,
    };

    try {
      setError("");
      const createdZone = await createPropertyZone(propertyId, nextZone);
      const nextState = { ...createdZone, photos: [] };
      setZones((currentZones) => [...currentZones, nextState]);
      setSelectedZoneId(createdZone.id);
      setMessage("Nueva zona creada.");
    } catch (zoneError) {
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
          currentZone.id === zone.id ? { ...updatedZone, photos: currentZone.photos, name: trimmedName } : currentZone,
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
      setSelectedZoneId((currentSelected) => (currentSelected === zoneId ? null : currentSelected));
      setMessage("Zona eliminada. El orden se recalcula automáticamente.");
    } catch (zoneError) {
      setError(zoneError instanceof Error ? zoneError.message : "No se pudo eliminar la zona.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Plano de la propiedad</h2>
            <p className="mt-1 text-sm text-slate-500">
              Sube el plano y haz clic sobre cualquier punto para crear una habitación. Luego arrástrala y redimensiónala con el control de la esquina.
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
          <div className="relative mt-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <div className="relative w-full" style={{ aspectRatio: `${STAGE_WIDTH} / ${STAGE_HEIGHT}` }}>
              <img
                src={floorPlanUrl}
                alt="Plano de la propiedad"
                className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              />
              <Stage
                ref={stageRef}
                width={STAGE_WIDTH}
                height={STAGE_HEIGHT}
                style={{ width: "100%", height: "100%" }}
                onMouseDown={handleStageMouseDown}
              >
                <Layer>
                  {zones.map((zone) => {
                    const points = normalizePoints(zone.points);
                    const isSelected = selectedZoneId === zone.id;
                    const isEditing = editingZoneId === zone.id;
                    const centerX = points.reduce((sum, point, index) => (index % 2 === 0 ? sum + point : sum), 0) / 4;
                    const centerY = points.reduce((sum, point, index) => (index % 2 === 1 ? sum + point : sum), 0) / 4;

                    return (
                      <Group key={zone.id}>
                        <Line
                          points={points}
                          closed
                          perfectDrawEnabled={false}
                          draggable={isSelected && !isEditing}
                          listening={!isEditing}
                          fill={isSelected ? "rgba(14,165,233,0.28)" : "rgba(14,165,233,0.16)"}
                          stroke="#0284c7"
                          strokeWidth={isSelected ? 3 : 2}
                          onMouseDown={(event) => {
                            event.cancelBubble = true;
                            setSelectedZoneId(zone.id);
                            setEditingZoneId(null);
                          }}
                          onDblClick={(event) => {
                            event.cancelBubble = true;
                            setSelectedZoneId(zone.id);
                            setEditingZoneId(zone.id);
                          }}
                          onDragEnd={(event) => {
                            const offsetX = event.target.x();
                            const offsetY = event.target.y();
                            const nextPoints = points.map((point, index) =>
                              index % 2 === 0 ? point + offsetX : point + offsetY,
                            );
                            event.target.position({ x: 0, y: 0 });
                            void updateZonePoints(zone.id, nextPoints);
                          }}
                        />

                        {isEditing &&
                          points.map((point, index) => {
                            if (index % 2 !== 0) return null;

                            const x = point;
                            const y = points[index + 1];

                            return (
                              <Circle
                                key={`${zone.id}-anchor-${index}`}
                                x={x}
                                y={y}
                                radius={7}
                                fill="#fff"
                                stroke="#0284c7"
                                strokeWidth={2}
                                draggable={true}
                                onDragStart={(event) => {
                                  event.cancelBubble = true;
                                }}
                                onDragEnd={(event) => {
                                  const node = event.target;
                                  const nextPoints = [...points];
                                  nextPoints[index] = clamp(node.x(), 0, STAGE_WIDTH);
                                  nextPoints[index + 1] = clamp(node.y(), 0, STAGE_HEIGHT);
                                  void updateZonePoints(zone.id, nextPoints);
                                }}
                              />
                            );
                          })}

                        {isEditing &&
                          points.map((point, index) => {
                            if (index % 2 !== 0) return null;

                            const currentX = point;
                            const currentY = points[index + 1];
                            const nextIndex = (index + 2) % points.length;
                            const nextX = points[nextIndex];
                            const nextY = points[nextIndex + 1] ?? points[1];
                            const midX = (currentX + nextX) / 2;
                            const midY = (currentY + nextY) / 2;

                            return (
                              <Circle
                                key={`${zone.id}-mid-${index}`}
                                x={midX}
                                y={midY}
                                radius={5}
                                fill="rgba(14,165,233,0.35)"
                                stroke="#0284c7"
                                strokeWidth={1}
                                draggable={true}
                                onDragStart={(event) => {
                                  event.cancelBubble = true;
                                  const nextPoints = [...points];
                                  nextPoints.splice(index + 2, 0, midX, midY);
                                  void updateZonePoints(zone.id, nextPoints);
                                }}
                              />
                            );
                          })}

                        <Text
                          x={centerX}
                          y={centerY}
                          text={zone.name}
                          fontSize={18}
                          fontStyle="600"
                          fill="#0f172a"
                          offsetX={50}
                          offsetY={10}
                          pointerEvents="none"
                        />
                      </Group>
                    );
                  })}
                </Layer>
              </Stage>
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
                  <ZoneEditor
                    key={zone.id}
                    zone={zone}
                    onSave={handleZoneUpdate}
                    onDelete={handleZoneDelete}
                  />
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
        <PropertyZonePhotos
          propertyId={zone.property_id}
          zoneId={zone.id}
          photos={zone.photos ?? []}
        />
      </div>
    </div>
  );
}
