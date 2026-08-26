// Builds a value -> hex color function for a given numeric range.
// Used to color-code vessel trajectories by whichever variable is selected.

import { VesselId } from "@/domain";

export interface ColorStop {
  value: number; // 0..1 position
  color: [number, number, number]; // RGB
}

// Blue (low) -> Yellow (mid) -> Red (high). Colorblind-friendlier than a
// pure red-green scale, and reads intuitively as "cool to hot" for
// speed/risk-style variables.
const DEFAULT_STOPS: ColorStop[] = [
  { value: 0, color: [37, 99, 235] }, // blue-600
  { value: 0.5, color: [234, 179, 8] }, // yellow-500
  { value: 1, color: [220, 38, 38] }, // red-600
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function toHex(rgb: [number, number, number]): string {
  return (
    "#" + rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")
  );
}

/** Interpolates a color for normalized position t (0..1) across DEFAULT_STOPS. */
function colorAt(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < DEFAULT_STOPS.length - 1; i++) {
    const a = DEFAULT_STOPS[i];
    const b = DEFAULT_STOPS[i + 1];
    if (clamped >= a.value && clamped <= b.value) {
      const localT = (clamped - a.value) / (b.value - a.value || 1);
      const rgb: [number, number, number] = [
        lerp(a.color[0], b.color[0], localT),
        lerp(a.color[1], b.color[1], localT),
        lerp(a.color[2], b.color[2], localT),
      ];
      return toHex(rgb);
    }
  }
  return toHex(DEFAULT_STOPS[DEFAULT_STOPS.length - 1].color);
}

export interface Scale {
  colorFor: (value: number | null) => string;
  min: number;
  max: number;
}

const NULL_COLOR = "#9ca3af"; // gray-400 — visually distinct "no data" marker

/**
 * Builds a scale from a set of values. Returns a colorFor() function that
 * normalizes any value against the observed min/max and maps it to a color.
 * Values outside [min,max] (shouldn't happen, but just in case) are clamped.
 * null -> a neutral gray, so missing data reads as "no data", not "zero".
 */
export function makeColorScale(values: (number | null)[]): Scale {
  const numeric = values.filter(
    (v): v is number => v !== null && Number.isFinite(v),
  );
  const min = numeric.length > 0 ? Math.min(...numeric) : 0;
  const max = numeric.length > 0 ? Math.max(...numeric) : 1;
  const range = max - min || 1; // avoid divide-by-zero if every value is identical

  return {
    min,
    max,
    colorFor: (value) => {
      if (value === null || !Number.isFinite(value)) return NULL_COLOR;
      return colorAt((value - min) / range);
    },
  };
}

// Define multi-hue sequential palettes for each vessel.
// h: [startHue, endHue], l: [startLightness, endLightness]
const VESSEL_PALETTES: Record<
  VesselId,
  { h: [number, number]; s: number; l: [number, number] }
> = {
  IMO1: { h: [45, 10], s: 85, l: [72, 42] }, // Amber -> Orange -> Red
  IMO2: { h: [190, 225], s: 80, l: [72, 40] }, // Cyan -> Blue -> Indigo
  IMO3: { h: [95, 145], s: 72, l: [70, 38] }, // Yellow-green -> Green -> Teal
};

/**
 * Generates a color by interpolating both Hue and Lightness simultaneously.
 */
export function getVesselColor(
  vesselId: VesselId,
  value: number | null,
  min: number,
  max: number,
) {
  const palette = VESSEL_PALETTES[vesselId];

  if (value === null) {
    return `hsl(${palette.h[0]}, 0%, 50%)`; // Gray fallback for null
  }

  // Normalize value between 0 and 1
  const t =
    min === max ? 1 : Math.max(0, Math.min(1, (value - min) / (max - min)));

  // Interpolate Hue and Lightness
  const h = palette.h[0] + t * (palette.h[1] - palette.h[0]);
  const l = palette.l[0] + t * (palette.l[1] - palette.l[0]);

  return `hsl(${h}, ${palette.s}%, ${l}%)`;
}
