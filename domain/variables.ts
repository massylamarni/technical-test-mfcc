import { MergedVesselRow } from "@/lib/csv/parse-csv";

export interface VariableOption {
  key: keyof MergedVesselRow;
  label: string;
  unit: string;
}

export const VARIABLE_OPTIONS: VariableOption[] = [
  { key: "speed", label: "Speed", unit: "kn" },
  { key: "rollMotion", label: "Roll motion", unit: "deg" },
  { key: "pitchMotion", label: "Pitch motion", unit: "deg" },
  { key: "gm", label: "Metacentric height (GM)", unit: "m" },
  {
    key: "parametricRollAdvanced2To1",
    label: "Parametric roll risk",
    unit: "-",
  },
  { key: "tAft", label: "Aft draft", unit: "m" },
  { key: "tFwd", label: "Forward draft", unit: "m" },
];

export const DEFAULT_VARIABLE_KEY: keyof MergedVesselRow = "speed";
