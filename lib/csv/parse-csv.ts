import { VesselId } from "@/domain";
import Papa from "papaparse";

// ---------- shared helpers ----------

/** "" / undefined / whitespace-only -> null. Otherwise parse as float. */
function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (str === "") return null;
  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}

/** Parses "YYYY-MM-DD HH:mm:ss" -> Date, or null if unparsable. */
function parseTimestamp(raw: string | undefined): Date | null {
  if (!raw) return null;
  const date = new Date(raw.trim().replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Builds a lookup from "label before the bracket" -> actual CSV header,
 * e.g. "Speed [kn] (NAVIGATION_GPS)" -> key "Speed"
 */
function buildLabelIndex(headers: string[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const header of headers) {
    const label = header.split("[")[0].trim();
    index.set(label, header);
  }
  return index;
}

function getByLabel(
  row: Record<string, string>,
  labelIndex: Map<string, string>,
  label: string,
): number | null {
  const header = labelIndex.get(label);
  return header ? toNullableNumber(row[header]) : null;
}

function parseCsv(csvText: string): {
  data: Record<string, string>[];
  headers: string[];
} {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  if (result.errors.length > 0) {
    console.warn(
      `CSV parse warning(s): ${result.errors.length}`,
      result.errors.slice(0, 3),
    );
  }
  return { data: result.data, headers: result.meta.fields ?? [] };
}

// ---------- GPS ----------

export interface GpsRow {
  vesselId: VesselId;
  date: Date;
  course: number | null;
  heading: number | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null; // knots
}

export function parseGpsCsv(csvText: string, vesselId: VesselId): GpsRow[] {
  const { data, headers } = parseCsv(csvText);
  const labelIndex = buildLabelIndex(headers);
  const rows: GpsRow[] = [];

  for (const raw of data) {
    const date = parseTimestamp(raw.Timestamp);
    const latitude = getByLabel(raw, labelIndex, "Latitude");
    const longitude = getByLabel(raw, labelIndex, "Longitude");
    if (!date || latitude === null || longitude === null) continue; // no position = unusable

    rows.push({
      vesselId,
      date,
      course: getByLabel(raw, labelIndex, "Course"),
      heading: getByLabel(raw, labelIndex, "Heading"),
      latitude,
      longitude,
      speed: getByLabel(raw, labelIndex, "Speed"),
    });
  }

  rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  return rows;
}

// ---------- MACS3 (stability) ----------

export interface Macs3Row {
  vesselId: VesselId;
  date: Date;
  displacement: number | null;
  fsm: number | null;
  gg: number | null;
  gm: number | null;
  gmFluid: number | null;
  kg: number | null;
  lcg: number | null;
  rxx: number | null;
  ryy: number | null;
  rzz: number | null;
  tAft: number | null;
  tFwd: number | null;
  tPitch: number | null;
  tRoll: number | null;
  tcg: number | null;
}

export function parseMacs3Csv(csvText: string, vesselId: VesselId): Macs3Row[] {
  const { data, headers } = parseCsv(csvText);
  const labelIndex = buildLabelIndex(headers);
  const rows: Macs3Row[] = [];

  for (const raw of data) {
    const date = parseTimestamp(raw.Timestamp);
    if (!date) continue;

    rows.push({
      vesselId,
      date,
      displacement: getByLabel(raw, labelIndex, "Displacement"),
      fsm: getByLabel(raw, labelIndex, "FSM"),
      gg: getByLabel(raw, labelIndex, "GG"),
      gm: getByLabel(raw, labelIndex, "GM"),
      gmFluid: getByLabel(raw, labelIndex, "GMFluid"),
      kg: getByLabel(raw, labelIndex, "Kg"),
      lcg: getByLabel(raw, labelIndex, "Lcg"),
      rxx: getByLabel(raw, labelIndex, "Rxx"),
      ryy: getByLabel(raw, labelIndex, "Ryy"),
      rzz: getByLabel(raw, labelIndex, "Rzz"),
      tAft: getByLabel(raw, labelIndex, "TAft"),
      tFwd: getByLabel(raw, labelIndex, "TFwd"),
      tPitch: getByLabel(raw, labelIndex, "TPitch"),
      tRoll: getByLabel(raw, labelIndex, "TRoll"),
      tcg: getByLabel(raw, labelIndex, "Tcg"),
    });
  }

  rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  return rows;
}

// ---------- MOTIONS (IMU + parametric roll risk) ----------

export interface MotionsRow {
  vesselId: VesselId;
  date: Date;
  c1: number | null;
  c2: number | null;
  c3: number | null;
  cTotal: number | null;
  parametricRollAdvanced2To1: number | null;
  pitchAcceleration: number | null;
  pitchMotion: number | null;
  pitchMotionPeriod: number | null;
  pitchVelocity: number | null;
  rollAcceleration: number | null;
  rollMotion: number | null;
  rollMotionPeriod: number | null;
  rollVelocity: number | null;
  xAcceleration: number | null;
  xMotion: number | null;
  xVelocity: number | null;
  yAcceleration: number | null;
  yMotion: number | null;
  yVelocity: number | null;
  yawAcceleration: number | null;
  yawMotion: number | null;
  yawVelocity: number | null;
  zAcceleration: number | null;
  zMotion: number | null;
  zVelocity: number | null;
}

export function parseMotionsCsv(
  csvText: string,
  vesselId: VesselId,
): MotionsRow[] {
  const { data, headers } = parseCsv(csvText);
  const labelIndex = buildLabelIndex(headers);
  const rows: MotionsRow[] = [];

  for (const raw of data) {
    const date = parseTimestamp(raw.Timestamp);
    if (!date) continue;

    rows.push({
      vesselId,
      date,
      c1: getByLabel(raw, labelIndex, "C1"),
      c2: getByLabel(raw, labelIndex, "C2"),
      c3: getByLabel(raw, labelIndex, "C3"),
      cTotal: getByLabel(raw, labelIndex, "CTotal"),
      parametricRollAdvanced2To1: getByLabel(
        raw,
        labelIndex,
        "Parametric Roll Advanced 2 to 1",
      ),
      pitchAcceleration: getByLabel(raw, labelIndex, "Pitch acceleration"),
      pitchMotion: getByLabel(raw, labelIndex, "Pitch motion"),
      pitchMotionPeriod: getByLabel(raw, labelIndex, "Pitch motion - period"),
      pitchVelocity: getByLabel(raw, labelIndex, "Pitch velocity"),
      rollAcceleration: getByLabel(raw, labelIndex, "Roll acceleration"),
      rollMotion: getByLabel(raw, labelIndex, "Roll motion"),
      rollMotionPeriod: getByLabel(raw, labelIndex, "Roll motion - period"),
      rollVelocity: getByLabel(raw, labelIndex, "Roll velocity"),
      xAcceleration: getByLabel(raw, labelIndex, "X acceleration"),
      xMotion: getByLabel(raw, labelIndex, "X motion"),
      xVelocity: getByLabel(raw, labelIndex, "X velocity"),
      yAcceleration: getByLabel(raw, labelIndex, "Y acceleration"),
      yMotion: getByLabel(raw, labelIndex, "Y motion"),
      yVelocity: getByLabel(raw, labelIndex, "Y velocity"),
      yawAcceleration: getByLabel(raw, labelIndex, "Yaw acceleration"),
      yawMotion: getByLabel(raw, labelIndex, "Yaw motion"),
      yawVelocity: getByLabel(raw, labelIndex, "Yaw velocity"),
      zAcceleration: getByLabel(raw, labelIndex, "Z acceleration"),
      zMotion: getByLabel(raw, labelIndex, "Z motion"),
      zVelocity: getByLabel(raw, labelIndex, "Z velocity"),
    });
  }

  rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  return rows;
}

// ---------- merge ----------

export interface MergedVesselRow {
  vesselId: VesselId;
  date: Date;
  // GPS
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  course: number | null;
  heading: number | null;
  // MACS3
  displacement: number | null;
  fsm: number | null;
  gg: number | null;
  gm: number | null;
  gmFluid: number | null;
  kg: number | null;
  lcg: number | null;
  rxx: number | null;
  ryy: number | null;
  rzz: number | null;
  tAft: number | null;
  tFwd: number | null;
  tPitch: number | null;
  tRoll: number | null;
  tcg: number | null;
  // MOTIONS
  c1: number | null;
  c2: number | null;
  c3: number | null;
  cTotal: number | null;
  parametricRollAdvanced2To1: number | null;
  pitchAcceleration: number | null;
  pitchMotion: number | null;
  pitchMotionPeriod: number | null;
  pitchVelocity: number | null;
  rollAcceleration: number | null;
  rollMotion: number | null;
  rollMotionPeriod: number | null;
  rollVelocity: number | null;
  xAcceleration: number | null;
  xMotion: number | null;
  xVelocity: number | null;
  yAcceleration: number | null;
  yMotion: number | null;
  yVelocity: number | null;
  yawAcceleration: number | null;
  yawMotion: number | null;
  yawVelocity: number | null;
  zAcceleration: number | null;
  zMotion: number | null;
  zVelocity: number | null;
}

/**
 * Merges GPS + MOTIONS (joined on exact timestamp — both sampled every ~15 min)
 * with MACS3 (as-of joined — irregular readings, valid until the next one).
 * All three row arrays are already sorted ascending by date
 * (parseGpsCsv / parseMacs3Csv / parseMotionsCsv guarantee this).
 */
export function mergeVesselData(
  gpsRows: GpsRow[],
  motionsRows: MotionsRow[],
  macs3Rows: Macs3Row[],
): MergedVesselRow[] {
  // Index MOTIONS rows by exact ISO timestamp for O(1) lookup during the GPS pass.
  const motionsByTime = new Map<number, MotionsRow>();
  for (const m of motionsRows) motionsByTime.set(m.date.getTime(), m);

  const merged: MergedVesselRow[] = [];
  let macs3Cursor = 0; // advances forward since gpsRows is sorted — avoids O(n*m) rescans

  for (const gps of gpsRows) {
    const motion = motionsByTime.get(gps.date.getTime()) ?? null;

    // Advance the MACS3 cursor to the last reading at or before this timestamp.
    while (
      macs3Cursor + 1 < macs3Rows.length &&
      macs3Rows[macs3Cursor + 1].date.getTime() <= gps.date.getTime()
    ) {
      macs3Cursor++;
    }
    const macs3 =
      macs3Rows.length > 0 &&
      macs3Rows[macs3Cursor].date.getTime() <= gps.date.getTime()
        ? macs3Rows[macs3Cursor]
        : null;

    merged.push({
      vesselId: gps.vesselId,
      date: gps.date,
      // GPS
      course: gps.course,
      heading: gps.heading,
      latitude: gps.latitude,
      longitude: gps.longitude,
      speed: gps.speed,
      // MACS3
      displacement: macs3?.displacement ?? null,
      fsm: macs3?.fsm ?? null,
      gg: macs3?.gg ?? null,
      gm: macs3?.gm ?? null,
      gmFluid: macs3?.gmFluid ?? null,
      kg: macs3?.kg ?? null,
      lcg: macs3?.lcg ?? null,
      rxx: macs3?.rxx ?? null,
      ryy: macs3?.ryy ?? null,
      rzz: macs3?.rzz ?? null,
      tAft: macs3?.tAft ?? null,
      tFwd: macs3?.tFwd ?? null,
      tPitch: macs3?.tPitch ?? null,
      tRoll: macs3?.tRoll ?? null,
      tcg: macs3?.tcg ?? null,
      // MOTIONS
      c1: motion?.c1 ?? null,
      c2: motion?.c2 ?? null,
      c3: motion?.c3 ?? null,
      cTotal: motion?.cTotal ?? null,
      parametricRollAdvanced2To1: motion?.parametricRollAdvanced2To1 ?? null,
      pitchAcceleration: motion?.pitchAcceleration ?? null,
      pitchMotion: motion?.pitchMotion ?? null,
      pitchMotionPeriod: motion?.pitchMotionPeriod ?? null,
      pitchVelocity: motion?.pitchVelocity ?? null,
      rollAcceleration: motion?.rollAcceleration ?? null,
      rollMotion: motion?.rollMotion ?? null,
      rollMotionPeriod: motion?.rollMotionPeriod ?? null,
      rollVelocity: motion?.rollVelocity ?? null,
      xAcceleration: motion?.xAcceleration ?? null,
      xMotion: motion?.xMotion ?? null,
      xVelocity: motion?.xVelocity ?? null,
      yAcceleration: motion?.yAcceleration ?? null,
      yMotion: motion?.yMotion ?? null,
      yVelocity: motion?.yVelocity ?? null,
      yawAcceleration: motion?.yawAcceleration ?? null,
      yawMotion: motion?.yawMotion ?? null,
      yawVelocity: motion?.yawVelocity ?? null,
      zAcceleration: motion?.zAcceleration ?? null,
      zMotion: motion?.zMotion ?? null,
      zVelocity: motion?.zVelocity ?? null,
    });
  }

  return merged;
}

/** Parse + merge one vessel's three raw file texts in one call. */
export function loadVessel(
  vesselId: VesselId,
  gpsCsvText: string,
  macs3CsvText: string,
  motionsCsvText: string,
): MergedVesselRow[] {
  const gps = parseGpsCsv(gpsCsvText, vesselId);
  const macs3 = parseMacs3Csv(macs3CsvText, vesselId);
  const motions = parseMotionsCsv(motionsCsvText, vesselId);
  return mergeVesselData(gps, motions, macs3);
}

/**
 * Groups a flat merged dataset into one array per vessel — useful right before
 * rendering (e.g. one trajectory line per vessel on the map), but NOT how the
 * data should be stored/passed around otherwise: filtering, sorting, and
 * scaling (e.g. min/max for a color gradient) are all simpler on the flat
 * array, so group only at the point where a per-vessel shape is actually needed.
 */
export function groupRowsByVessel(
  rows: MergedVesselRow[],
): Record<VesselId, MergedVesselRow[]> {
  const grouped: Record<VesselId, MergedVesselRow[]> = {
    IMO1: [],
    IMO2: [],
    IMO3: [],
  };
  for (const row of rows) {
    grouped[row.vesselId].push(row);
  }
  return grouped;
}

/** Filters a merged dataset by vessel subset and date range */
export function filterMergedRows(
  rows: MergedVesselRow[],
  vesselIds: VesselId[],
  startDate: Date = new Date(0),
  endDate: Date = new Date(),
): MergedVesselRow[] {
  const idSet = new Set(vesselIds);
  return rows.filter(
    (r) => idSet.has(r.vesselId) && r.date >= startDate && r.date <= endDate,
  );
}
