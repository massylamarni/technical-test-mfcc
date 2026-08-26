"use client";

import { VARIABLE_OPTIONS, VariableOption } from "@/lib/variables";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VESSEL_IDS, VesselId } from "@/domain";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface VesselControlsProps {
  selectedVessels: VesselId[];
  onVesselsChange: (vessels: VesselId[]) => void;
  startDate: string; // yyyy-mm-dd, native <input type="date"> format
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  selectedVariableKey: VariableOption["key"];
  onVariableChange: (key: VariableOption["key"]) => void;
  setToggle: Dispatch<SetStateAction<boolean>>;
}

export function VesselControls({
  selectedVessels,
  onVesselsChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  selectedVariableKey,
  onVariableChange,
  setToggle,
}: VesselControlsProps) {
  function toggleVessel(vesselId: VesselId, checked: boolean) {
    if (checked) {
      onVesselsChange([...selectedVessels, vesselId]);
    } else {
      onVesselsChange(selectedVessels.filter((v) => v !== vesselId));
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Vessel operations history</CardTitle>
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

      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label>Vessels</Label>
            <div className="flex flex-col gap-2">
              {VESSEL_IDS.map((vesselId) => (
                <div key={vesselId} className="flex items-center gap-2">
                  <Checkbox
                    id={`vessel-${vesselId}`}
                    checked={selectedVessels.includes(vesselId)}
                    onCheckedChange={(checked) =>
                      toggleVessel(vesselId, checked === true)
                    }
                  />
                  <Label
                    htmlFor={`vessel-${vesselId}`}
                    className="text-xs cursor-pointer"
                  >
                    {vesselId}
                  </Label>
                </div>
              ))}
            </div>
            {selectedVessels.length === 0 && (
              <p className="text-xs text-red-500">Select at least one vessel</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Time window</Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="start-date"
                  className="w-10 text-xs text-muted-foreground"
                >
                  Start
                </Label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="end-date"
                  className="w-10 text-xs text-muted-foreground"
                >
                  End
                </Label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                />
              </div>
            </div>
            {startDate && endDate && startDate > endDate && (
              <p className="text-xs text-red-500">
                Start date must be before end date
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Color trajectory by</Label>
            <Select
              value={selectedVariableKey}
              onValueChange={(value) =>
                onVariableChange(value as VariableOption["key"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VARIABLE_OPTIONS.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}{" "}
                    {option.unit !== "-" ? `(${option.unit})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
