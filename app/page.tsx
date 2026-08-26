// app/dashboard/page.tsx
"use client";

import { useMemo, useState } from "react";
import { VARIABLE_OPTIONS, DEFAULT_VARIABLE_KEY } from "@/lib/variables";
import { useVesselData } from "@/hooks/useVesselData";
import { VesselControls } from "@/components/vesselControls";
import { TrajectoryMap } from "@/components/trajectoryMap";
import { VESSEL_IDS, VesselId } from "@/domain";
import { MapLegend } from "@/components/mapLegend";
import { Button } from "@/components/ui/button";
import { BadgeQuestionMark, Settings2 } from "lucide-react";

// Dataset spans roughly March-December 2026 per the CSVs — adjust these
// defaults if your actual file range differs.
const DEFAULT_START = "2026-03-01";
const DEFAULT_END = "2026-03-31";

export default function DashboardPage() {
  const [selectedVessels, setSelectedVessels] = useState<VesselId[]>([
    ...VESSEL_IDS,
  ]);
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [endDate, setEndDate] = useState(DEFAULT_END);
  const [variableKey, setVariableKey] = useState(DEFAULT_VARIABLE_KEY);
  const [vesselControlsToggle, setVesselControlsToggle] = useState(false);
  const [mapLegendToggle, setMapLegendToggle] = useState(false);

  const selectedVariable =
    VARIABLE_OPTIONS.find((v) => v.key === variableKey) ?? VARIABLE_OPTIONS[0];

  const isValidRange = Boolean(startDate && endDate && startDate <= endDate);

  // Memoized so identity only changes when the underlying date STRING
  // changes, not on every render — useVesselData's effect depends on these
  // Date objects directly, so an unstable identity here would cause it to
  // refetch on every render regardless of whether the date actually changed.
  const startDateObj = useMemo(
    () => (isValidRange ? new Date(startDate) : null),
    [isValidRange, startDate],
  );
  const endDateObj = useMemo(
    () => (isValidRange ? new Date(endDate) : null),
    [isValidRange, endDate],
  );

  const { rowsByVessel, isLoading, error } = useVesselData(
    selectedVessels,
    startDateObj,
    endDateObj,
  );

  return (
    <div className="flex h-screen w-full">
      <main className="relative flex-1">
        {isLoading && (
          <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-md bg-white px-3 py-1.5 text-sm shadow-md">
            Loading...
          </div>
        )}
        {error && (
          <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-md bg-red-50 px-3 py-1.5 text-sm text-red-700 shadow-md">
            {error}
          </div>
        )}
        <div className="relative h-full w-full">
          {selectedVessels.length > 0 ? (
            <TrajectoryMap
              rowsByVessel={rowsByVessel}
              variable={selectedVariable}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Select at least one vessel to see its trajectory.
            </div>
          )}
        </div>

        <div className="absolute top-2.5 left-2.5 w-full max-w-xs">
          {vesselControlsToggle ? (
            <VesselControls
              selectedVessels={selectedVessels}
              onVesselsChange={setSelectedVessels}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              selectedVariableKey={variableKey}
              onVariableChange={setVariableKey}
              setToggle={setVesselControlsToggle}
            />
          ) : (
            <Button
              variant="default"
              size="icon"
              className="dark:bg-background/95 shadow-md backdrop-blur-sm dark:hover:bg-background/80"
              onClick={() => setVesselControlsToggle(true)}
            >
              <Settings2 className="text-foreground" />
            </Button>
          )}
        </div>

        {selectedVessels.length > 0 && (
          <div className="absolute bottom-2.5 left-2.5 w-full max-w-xs">
            {mapLegendToggle ? (
              <MapLegend
                variable={selectedVariable}
                rowsByVessel={rowsByVessel}
                setToggle={setMapLegendToggle}
              />
            ) : (
              <Button
                variant="default"
                size="icon"
                className="dark:bg-background/95 shadow-md backdrop-blur-sm dark:hover:bg-background/80"
                onClick={() => setMapLegendToggle(true)}
              >
                <BadgeQuestionMark className="text-foreground" />
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
