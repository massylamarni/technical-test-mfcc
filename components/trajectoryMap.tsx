"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { MergedVesselRow } from "@/lib/csv/parse-csv";
import { VariableOption } from "@/lib/variables";
import { cumulativeDistanceFractions } from "@/lib/map/geo";
import { VESSEL_IDS, VesselId } from "@/domain";
import { getVesselColor } from "@/lib/map/color-scale";
import { Button } from "./ui/button";
import { Compass, Minus, Plus } from "lucide-react";

if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
}

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

interface TrajectoryMapProps {
  rowsByVessel: Record<VesselId, MergedVesselRow[]>;
  variable: VariableOption;
}

function unwrapLongitudes(coordinates: [number, number][]): [number, number][] {
  if (coordinates.length === 0) return [];
  const result: [number, number][] = [coordinates[0]];
  for (let i = 1; i < coordinates.length; i++) {
    const [longitude, latitude] = coordinates[i];
    let adjustedLongitude = longitude;
    const previousLongitude = result[i - 1][0];

    while (adjustedLongitude - previousLongitude > 180)
      adjustedLongitude -= 360;
    while (adjustedLongitude - previousLongitude < -180)
      adjustedLongitude += 360;

    result.push([adjustedLongitude, latitude]);
  }
  return result;
}

export function TrajectoryMap({ rowsByVessel, variable }: TrajectoryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [0, 20],
      zoom: 1.5,
    });
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function draw(map: maplibregl.Map) {
      // Find only vessels that have enough valid data to be displayed
      const activeVessels = VESSEL_IDS.filter((vesselId) => {
        const rows = (rowsByVessel[vesselId] ?? []).filter(
          (r) => r.latitude !== null && r.longitude !== null,
        );
        return rows.length >= 2;
      });

      // Calculate global min/max ONLY across the active vessels
      const allValues = activeVessels
        .flatMap((id) =>
          (rowsByVessel[id] ?? []).map((r) => r[variable.key] as number | null),
        )
        .filter((v): v is number => v !== null);

      const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
      const maxVal = allValues.length > 0 ? Math.max(...allValues) : 1;

      let hasAnyPoints = false;
      const bounds = new maplibregl.LngLatBounds();

      for (const vesselId of VESSEL_IDS) {
        const rows = (rowsByVessel[vesselId] ?? []).filter(
          (r) => r.latitude !== null && r.longitude !== null,
        );

        const sourceId = `trajectory-${vesselId}`;
        const layerId = `trajectory-line-${vesselId}`;
        const labelSourceId = `trajectory-label-${vesselId}`;
        const labelLayerId = `trajectory-label-layer-${vesselId}`;

        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
        if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
        if (map.getSource(labelSourceId)) map.removeSource(labelSourceId);

        // If not enough rows, skip drawing
        if (rows.length < 2) continue;

        hasAnyPoints = true;

        const rawCoordinates: [number, number][] = rows.map((r) => [
          r.longitude as number,
          r.latitude as number,
        ]);
        const coordinates = unwrapLongitudes(rawCoordinates);
        coordinates.forEach((coordinate) => bounds.extend(coordinate));
        const fractions = cumulativeDistanceFractions(coordinates);

        const gradientExpression: unknown[] = [
          "interpolate",
          ["linear"],
          ["line-progress"],
        ];
        const epsilon = 0.5 / fractions.length;
        let lastStop = -epsilon;

        for (let i = 0; i < fractions.length; i++) {
          if (lastStop >= 1) break;
          const stop = Math.min(
            fractions[i] <= lastStop ? lastStop + epsilon : fractions[i],
            1,
          );
          lastStop = stop;

          const value = rows[i][variable.key] as number | null;
          const color = getVesselColor(vesselId, value, minVal, maxVal);
          gradientExpression.push(stop, color);
        }

        map.addSource(sourceId, {
          type: "geojson",
          lineMetrics: true,
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates },
          },
        });

        map.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-width": 4,
            "line-gradient":
              gradientExpression as unknown as maplibregl.ExpressionSpecification,
          },
        });

        map.addSource(labelSourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: { label: vesselId },
            geometry: { type: "Point", coordinates: rawCoordinates[0] },
          },
        });

        map.addLayer({
          id: labelLayerId,
          type: "symbol",
          source: labelSourceId,
          layout: {
            "text-field": ["get", "label"],
            "text-size": 12,
            "text-offset": [0, -1.2],
            "text-anchor": "bottom",
          },
          paint: {
            "text-color": "#f8fafc",
            "text-halo-color": "#0f172a",
            "text-halo-width": 1.8,
          },
        });
      }

      if (hasAnyPoints && !bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 60, maxZoom: 8, duration: 500 });
      }
    }

    if (map.isStyleLoaded()) draw(map);
    else map.once("load", () => draw(map));
  }, [rowsByVessel, variable]);

  return (
    <>
      <div className="relative h-full w-full">
        <div ref={containerRef} className="h-full w-full" />

        <div className="absolute right-2.5 top-2.5 z-10 flex flex-col overflow-hidden rounded-md border bg-background shadow-md">
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-none"
            onClick={() => mapRef.current?.zoomIn()}
            aria-label="Zoom in"
          >
            <Plus />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-none border-y"
            onClick={() => mapRef.current?.zoomOut()}
            aria-label="Zoom out"
          >
            <Minus />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-none"
            onClick={() => mapRef.current?.resetNorth()}
            aria-label="Reset north"
          >
            <Compass />
          </Button>
        </div>
      </div>
    </>
  );
}
