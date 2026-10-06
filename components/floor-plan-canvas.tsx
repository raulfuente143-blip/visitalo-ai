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
}: FloorPlanCanvasProps) {
  const [pendingZone, setPendingZone] = useState<{ points: number[]; name: string } | null>(null);
  const previousZoneCount = useRef(zones.length);
  const lastClickTime = useRef<Record<string, number>>({});
  const activeSutureInsertIndex = useRef<number | null>(null);
  const activeSuturePoints = useRef<number[] | null>(null);
  const [hoveredSutureId, setHoveredSutureId] = useState<string | null>(null);
  const [draggingSutureId, setDraggingSutureId] = useState<string | null>(null);
  const [dragOffsets, setDragOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [localPoints, setLocalPoints] = useState<Record<string, number[]>>({});
  const dragOffsetsRef = useRef<Record<string, { x: number; y: number }>>({});
  const scaleX = size.width / STAGE_WIDTH;
  const scaleY = size.height / STAGE_HEIGHT;

  useEffect(() => {
    if (zones.length > previousZoneCount.current) {
      setPendingZone(null);
    }
    previousZoneCount.current = zones.length;
  }, [zones.length]);

  const handleStageMouseDown = (event: any) => {
    const stage = event.target.getStage();
    if (event.target !== stage || scaleX <= 0 || scaleY <= 0) return;

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
      onMouseDown={handleStageMouseDown}
      onTouchStart={handleStageMouseDown}
      style={{ position: "absolute", inset: 0 }}
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
            fill="rgba(14, 165, 233, 0.12)"
            stroke="#0284c7"
            strokeWidth={2}
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
                fill={isSelected ? "rgba(14, 165, 233, 0.28)" : "rgba(14, 165, 233, 0.16)"}
                stroke="#0284c7"
                strokeWidth={isEditing ? 4 : isSelected ? 3 : 2}
                onClick={(event: any) => {
                  event.cancelBubble = true;
                  const now = Date.now();
                  const last = lastClickTime.current[zone.id] ?? 0;
                  if (now - last < 300) {
                    onEditZone(zone.id);
                  } else {
                    onSelectZone(zone.id);
                  }
                  lastClickTime.current[zone.id] = now;
                }}
                onTouchStart={(event: any) => {
                  event.cancelBubble = true;
                  onSelectZone(zone.id);
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
                    radius={7}
                    fill="#1d4ed8"
                    opacity={1}
                    stroke="white"
                    strokeWidth={2}
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
                if (draggingSutureId === sutureId) return null;

                return (
                  <Circle
                    key={sutureId}
                    x={midX}
                    y={midY}
                    radius={4}
                    fill="#60a5fa"
                    opacity={hoveredSutureId === sutureId ? 0.9 : 0.6}
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
                text={zone.name}
                fontSize={18}
                fontStyle="600"
                fill="#0f172a"
                offsetX={50}
                offsetY={10}
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
