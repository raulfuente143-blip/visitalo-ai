"use client";

import { useRef, useState } from "react";
import { createPropertyZone, deletePropertyZone, saveFloorPlan, updatePropertyZone } from "@/app/actions/property-editor";
import { createClient } from "@/lib/supabase/client";

type Zone = {
  id: string;
  name: string;
  room_order: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type PropertyFloorPlanEditorProps = {
  propertyId: string;
  initialFloorPlanUrl: string | null;
  initialZones: Zone[];
};

export function PropertyFloorPlanEditor({
  propertyId,
  initialFloorPlanUrl,
  initialZones,
}: PropertyFloorPlanEditorProps) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [floorPlanUrl, setFloorPlanUrl] = useState(initialFloorPlanUrl);
  const [zones, setZones] = useState(initialZones);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  const handlePlanClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    if (!floorPlanUrl || isSaving) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    const roomOrder = zones.length + 1;
    const name = `Habitación ${roomOrder}`;

    setError("");
    setIsSaving(true);

    try {
      const newZone = await createPropertyZone(propertyId, {
        name,
        roomOrder,
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
      });
      setZones((currentZones) => [...currentZones, newZone]);
      setMessage(`${name} añadida. Puedes editar su nombre y orden.`);
    } catch (zoneError) {
      setError(zoneError instanceof Error ? zoneError.message : "No se pudo crear la zona.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleZoneUpdate = async (zone: Zone, name: string, roomOrder: number) => {
    if (!name.trim() || roomOrder < 1) return;

    setError("");
    try {
      const updatedZone = await updatePropertyZone(propertyId, zone.id, {
        name: name.trim(),
        roomOrder,
      });
      setZones((currentZones) =>
        currentZones.map((currentZone) => (currentZone.id === zone.id ? updatedZone : currentZone)),
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
      setZones((currentZones) => currentZones.filter((zone) => zone.id !== zoneId));
      setMessage("Zona eliminada.");
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
              Sube el plano y haz clic en cada habitación para crear una zona.
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
          <div
            className="relative mt-6 cursor-crosshair overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            onClick={handlePlanClick}
          >
            <img src={floorPlanUrl} alt="Plano de la propiedad" className="block h-auto w-full" />
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="absolute flex items-center justify-center border-2 border-sky-600 bg-sky-400/30 text-center text-xs font-bold text-sky-950 shadow-sm"
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  width: `${zone.width}%`,
                  height: `${zone.height}%`,
                  transform: "translate(-50%, -50%)",
                }}
                onClick={(event) => event.stopPropagation()}
                title={`${zone.room_order}. ${zone.name}`}
              >
                {zone.room_order}. {zone.name}
              </div>
            ))}
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
                Haz clic en el plano para añadir una habitación. El orden define el recorrido del vídeo.
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
              Todavía no hay zonas. Haz clic sobre una habitación del plano para crear la primera.
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
  onSave: (zone: Zone, name: string, roomOrder: number) => Promise<void>;
  onDelete: (zoneId: string) => Promise<void>;
}) {
  const [name, setName] = useState(zone.name);
  const [roomOrder, setRoomOrder] = useState(String(zone.room_order));

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_140px_auto_auto] md:items-end">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Nombre</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Orden</label>
        <input
          type="number"
          min="1"
          value={roomOrder}
          onChange={(event) => setRoomOrder(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
        />
      </div>
      <button
        type="button"
        onClick={() => onSave(zone, name, Number(roomOrder))}
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
  );
}
