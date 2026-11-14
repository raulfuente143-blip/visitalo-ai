"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Circle, Text, Image as KonvaImage } from "react-konva";

export type FloorPlanZone = {
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

export type FloorPlanCanvasProps = {
  size: { width: number; height: number };
  planImage: HTMLImageElement | null;
  zones: FloorPlanZone[];
  selectedZoneId: string | null;
  editingZoneId: string | null;
  onStageClick: (x: number, y: number, currentZoneCount: number) => void;
  onSelectZone: (zoneId: string) => void;
  onEditZone: (zoneId: string) => void;
  onZonePointsChange: (zoneId: string, points: number[]) => void;
  onUpdateZonePoints: (zoneId: string, points: number[]) => void;
  onDeselect?: () => void;
};

const STAGE_WIDTH = 1000;
const STAGE_HEIGHT = 700;

// Colores de la marca
const GOLD = "#D4AF37";
const GOLD_DARK = "#B8960C";
const FILL = "rgba(212, 175, 55, 0.16)";
const FILL_SELECTED = "rgba(212, 175, 55, 0.30)";
const LABEL_WIDTH = 220;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalizePoints = (points?: number[]) => {
  if (!points || points.length < 6 || points.length % 2 !== 0) {
    return [160, 160, 360, 160, 360, 260, 160, 260];
  }

  return points.map((point) => Number(point));
};

function isPointInPolygon(px: number, py: number, points: number[]): boolean {
  let inside = false;
  const n = points.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = points[i * 2], yi = points[i * 2 + 1];
    const xj = points[j * 2], yj = points[j * 2 + 1];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

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

export default function FloorPlanCanvas({
  size,
  planImage,
  zones,
  selectedZoneId,
  editingZoneId,
  onStageClick,
  onSelectZone,
  onEditZone,
  onZonePointsChange,
  onUpdateZonePoints,
  onDeselect,
}: FloorPlanCanvasProps) {
  const [pendingZone, setPendingZone] = useState<{ points: number[]; name: string } | null>(null);
  const previousZoneCount = useRef(zones.length);
  const activeSutureInsertIndex = useRef<number | null>(null);
  const activeSuturePoints = useRef<number[] | null>(null);
  const [hoveredSutureId, setHoveredSutureId] = useState<string | null>(null);
  const [draggingSutureId, setDraggingSutureId] = useState<string | null>(null);
  const [dragOffsets, setDragOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [localPoints, setLocalPoints] = useState<Record<string, number[]>>({});
  const dragOffsetsRef = useRef<Record<string, { x: number; y: number }>>({});
  const scaleX = size.width / STAGE_WIDTH;
  const scaleY = size.height / STAGE_HEIGHT;
  // Tamaño visual constante aunque el plano se vea pequeño (móvil)
  const handleScale = scaleX > 0 ? 1 / Math.max(scaleX, 0.35) : 1;

  useEffect(() => {
    if (zones.length > previousZoneCount.current) {
      setPendingZone(null);
    }
    previousZoneCount.current = zones.length;
  }, [zones.length]);

  // Se usa onClick/onTap: solo se dispara con un toque limpio, no al deslizar el dedo para hacer scroll.
  const handleStageTap = (event: any) => {
    const stage = event.target.getStage();
    if (event.target !== stage || scaleX <= 0 || scaleY <= 0) return;

    // Si hay una habitación seleccionada, el primer toque fuera solo la deselecciona.
    if ((selectedZoneId || editingZoneId) && onDeselect) {
      onDeselect();
      return;
    }

    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const stageX = pointer.x / scaleX;
    const stageY = pointer.y / scaleY;
    const clickIsInsideExistingZone = zones.some((zone) =>
      isPointInPolygon(stageX, stageY, normalizePoints(zone.points)),
    );
    if (clickIsInsideExistingZone) return;

    const points = createDefaultPolygonPoints(stageX, stageY);
    setPendingZone({ points, name: `Habitación ${zones.length + 1}` });
    onStageClick(stageX, stageY, zones.length);
  };

  return (
    <Stage
      width={size.width}
      height={size.height}
      onClick={handleStageTap}
      onTap={handleStageTap}
      style={{
        position: "absolute",
        inset: 0,
        // Con una habitación seleccionada, el dedo mueve la habitación; si no, permite hacer scroll.
        touchAction: selectedZoneId || editingZoneId ? "none" : "pan-y",
      }}
    >
      <Layer scaleX={scaleX} scaleY={scaleY}>
        {planImage ? (
          <KonvaImage
            image={planImage}
            x={0}
            y={0}
            width={STAGE_WIDTH}
            height={STAGE_HEIGHT}
            listening={false}
          />
        ) : null}

        {pendingZone ? (
          <Line
            points={pendingZone.points}
            closed={true}
            perfectDrawEnabled={false}
            fill={FILL}
            stroke={GOLD}
            strokeWidth={2 * handleScale}
            opacity={0.55}
            listening={false}
          />
        ) : null}

        {zones.map((zone) => {
          const points = normalizePoints(zone.points);
          const displayedPoints = localPoints[zone.id] ?? points;
          const isSelected = selectedZoneId === zone.id;
          const isEditing = editingZoneId === zone.id;
          const vertexCount = displayedPoints.length / 2;
          const centerX = displayedPoints
            .filter((_, index) => index % 2 === 0)
            .reduce((sum, point) => sum + point, 0) / vertexCount;
          const centerY = displayedPoints
            .filter((_, index) => index % 2 === 1)
            .reduce((sum, point) => sum + point, 0) / vertexCount;
          const dragOffset = dragOffsets[zone.id] ?? { x: 0, y: 0 };

          return (
            <Fragment key={zone.id}>
              <Line
                key={`${zone.id}-polygon`}
                points={displayedPoints}
                closed={true}
                perfectDrawEnabled={false}
                draggable={isSelected && !isEditing}
                listening={!isEditing}
                fill={isSelected ? FILL_SELECTED : FILL}
                stroke={isSelected || isEditing ? GOLD_DARK : GOLD}
                strokeWidth={(isEditing ? 4 : isSelected ? 3 : 2) * handleScale}
                hitStrokeWidth={16 * handleScale}
                onClick={(event: any) => {
                  event.cancelBubble = true;
                  onSelectZone(zone.id);
                }}
                onTap={(event: any) => {
                  event.cancelBubble = true;
                  onSelectZone(zone.id);
                }}
                onDblClick={(event: any) => {
                  event.cancelBubble = true;
                  onEditZone(zone.id);
                }}
                onDblTap={(event: any) => {
                  event.cancelBubble = true;
                  onEditZone(zone.id);
                }}
                onDragMove={(event: any) => {
                  const offset = { x: event.target.x(), y: event.target.y() };
                  dragOffsetsRef.current[zone.id] = offset;
                  setDragOffsets((current) => ({ ...current, [zone.id]: offset }));
                }}
                onDragEnd={(event: any) => {
                  const offsetX = event.target.x();
                  const offsetY = event.target.y();
                  const nextPoints = points.map((point, index) =>
                    index % 2 === 0 ? point + offsetX : point + offsetY,
                  );
                  event.target.position({ x: 0, y: 0 });
                  onZonePointsChange(zone.id, nextPoints);
                  onUpdateZonePoints(zone.id, nextPoints);
                  dragOffsetsRef.current[zone.id] = { x: 0, y: 0 };
                  setDragOffsets((current) => ({ ...current, [zone.id]: { x: 0, y: 0 } }));
                }}
              />

              {isEditing && points.map((point, index) => {
                if (index % 2 !== 0) return null;
                const handleVertexChange = (event: any, shouldSave: boolean) => {
                  const nextPoints = [...points];
                  nextPoints[index] = clamp(event.target.x(), 0, STAGE_WIDTH);
                  nextPoints[index + 1] = clamp(event.target.y(), 0, STAGE_HEIGHT);
                  onZonePointsChange(zone.id, nextPoints);
                  if (shouldSave) onUpdateZonePoints(zone.id, nextPoints);
                };

                return (
                  <Circle
                    key={`${zone.id}-vertex-${index}`}
                    x={point}
                    y={points[index + 1]}
                    radius={8 * handleScale}
                    hitStrokeWidth={22 * handleScale}
                    fill={GOLD}
                    stroke="white"
                    strokeWidth={2 * handleScale}
                    listening={true}
                    draggable={true}
                    onDragStart={(event: any) => {
                      event.cancelBubble = true;
                    }}
                    onDragMove={(event: any) => handleVertexChange(event, false)}
                    onDragEnd={(event: any) => handleVertexChange(event, true)}
                  />
                );
              })}

              {isEditing && points.map((point, index) => {
                if (index % 2 !== 0) return null;
                const nextIndex = (index + 2) % points.length;
                const midX = (point + points[nextIndex]) / 2;
                const midY = (points[index + 1] + points[(index + 3) % points.length]) / 2;
                const sutureId = `${zone.id}-suture-${index}`;
                const isDraggingThis = draggingSutureId === sutureId;
                // Otro punto intermedio en arrastre: se ocultan los demás para no confundir.
                if (draggingSutureId && !isDraggingThis) return null;

                return (
                  <Circle
                    key={sutureId}
                    x={midX}
                    y={midY}
                    radius={6 * handleScale}
                    hitStrokeWidth={20 * handleScale}
                    fill="white"
                    stroke={GOLD_DARK}
                    strokeWidth={2 * handleScale}
                    opacity={isDraggingThis ? 1 : hoveredSutureId === sutureId ? 0.95 : 0.75}
                    listening={true}
                    draggable={true}
                    onMouseEnter={() => setHoveredSutureId(sutureId)}
                    onMouseLeave={() => setHoveredSutureId(null)}
                    onDragStart={(event: any) => {
                      event.cancelBubble = true;
                      setDraggingSutureId(sutureId);
                      const insertIndex = index + 2;
                      const nextPoints = [...points];
                      nextPoints.splice(insertIndex, 0, midX, midY);
                      activeSutureInsertIndex.current = insertIndex;
                      activeSuturePoints.current = nextPoints;
                      setLocalPoints((current) => ({ ...current, [zone.id]: nextPoints }));
                    }}
                    onDragMove={(event: any) => {
                      const insertIndex = activeSutureInsertIndex.current;
                      if (insertIndex === null || !activeSuturePoints.current) return;

                      const nextPoints = [...activeSuturePoints.current];
                      nextPoints[insertIndex] = clamp(event.target.x(), 0, STAGE_WIDTH);
                      nextPoints[insertIndex + 1] = clamp(event.target.y(), 0, STAGE_HEIGHT);
                      activeSuturePoints.current = nextPoints;
                      setLocalPoints((current) => ({ ...current, [zone.id]: nextPoints }));
                    }}
                    onDragEnd={(event: any) => {
                      const insertIndex = activeSutureInsertIndex.current;
                      const nextPoints = activeSuturePoints.current
                        ? [...activeSuturePoints.current]
                        : [...points];

                      if (insertIndex !== null) {
                        nextPoints[insertIndex] = clamp(event.target.x(), 0, STAGE_WIDTH);
                        nextPoints[insertIndex + 1] = clamp(event.target.y(), 0, STAGE_HEIGHT);
                        setLocalPoints((current) => {
                          const nextLocalPoints = { ...current };
                          delete nextLocalPoints[zone.id];
                          return nextLocalPoints;
                        });
                        onZonePointsChange(zone.id, nextPoints);
                        onUpdateZonePoints(zone.id, nextPoints);
                      }

                      activeSutureInsertIndex.current = null;
                      activeSuturePoints.current = null;
                      setDraggingSutureId(null);
                    }}
                  />
                );
              })}

              <Text
                x={centerX + dragOffset.x}
                y={centerY + dragOffset.y}
                width={LABEL_WIDTH}
                offsetX={LABEL_WIDTH / 2}
                offsetY={10 * handleScale}
                align="center"
                text={zone.name}
                fontSize={18 * handleScale}
                fontStyle="600"
                fill="#0F172A"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth={3 * handleScale}
                fillAfterStrokeEnabled={true}
                listening={false}
                draggable={false}
              />
            </Fragment>
          );
        })}
      </Layer>
    </Stage>
  );
}
