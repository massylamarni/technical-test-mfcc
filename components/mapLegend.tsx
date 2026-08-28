"use client";

import { VESSEL_IDS, VesselId } from "@/domain";
import { MergedVesselRow } from "@/lib/csv/parse-csv";
import { VariableOption } from "@/domain/variables";
import { Card, CardAction, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { getVesselColor } from "@/lib/map/color-scale";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

export function MapLegend({
  variable,
  rowsByVessel,
  setToggle,
}: {
  variable: VariableOption;
  rowsByVessel: Record<VesselId, MergedVesselRow[]>;
  setToggle: Dispatch<SetStateAction<boolean>>;
}) {
  // Identify which vessels actually have displayable data
  const activeVessels = VESSEL_IDS.filter((vesselId) => {
    const rows = (rowsByVessel[vesselId] ?? []).filter(
      (r) => r.latitude !== null && r.longitude !== null,
    );
    return rows.length >= 2;
  });

  // If no vessels are selected/displayed, render nothing
  if (activeVessels.length === 0) return null;

  // Compute min/max strictly for the displayed vessels
  const allValues = activeVessels
    .flatMap((id) =>
      (rowsByVessel[id] ?? []).map((r) => r[variable.key] as number | null),
    )
    .filter((v): v is number => v !== null);

  const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 1;

  return (
    <Card className="flex">
      <CardHeader>
        <CardTitle>
          {variable.label} {variable.unit !== "-" ? `(${variable.unit})` : ""}
        </CardTitle>
        <CardAction>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setToggle(false)}
          >
            <ChevronDown />
          </Button>
        </CardAction>
      </CardHeader>
      <CardFooter>
        <div className="flex flex-col gap-2 w-full">
          {activeVessels.map((vesselId) => {
            // Calculate three stops for the legend gradient to show the multi-hue transition
            const colorStart = getVesselColor(vesselId, minVal, minVal, maxVal);
            const colorMid = getVesselColor(
              vesselId,
              (minVal + maxVal) / 2,
              minVal,
              maxVal,
            );
            const colorEnd = getVesselColor(vesselId, maxVal, minVal, maxVal);

            return (
              <div
                key={vesselId}
                className="flex items-center justify-between gap-5 w-full"
              >
                <span className="text-sm font-medium">{vesselId}</span>
                <div className="flex items-center gap-2 w-full">
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {minVal.toFixed(1)}
                  </span>
                  <div
                    className="h-1 min-w-20 w-full rounded"
                    style={{
                      background: `linear-gradient(to right, ${colorStart}, ${colorMid}, ${colorEnd})`,
                    }}
                  />
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {maxVal.toFixed(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardFooter>
    </Card>
  );
}
