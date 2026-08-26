import fs from "fs";
import path from "path";
import { loadVessel, MergedVesselRow, VesselId } from "./parse-csv";

const VESSEL_IDS: VesselId[] = ["III", "AAA", "LLL"];
const FILE_TYPES = ["GPS", "MACS3", "MOTIONS"] as const;
type FileType = (typeof FILE_TYPES)[number];

const FILENAME_PATTERN = /(III|AAA|LLL)\s+(GPS|MACS3|MOTIONS)\.csv$/i;

interface FileIndexEntry {
  vesselId: VesselId;
  fileType: FileType;
  fullPath: string;
}

/** Scans dataDir and builds a lookup of every matched file, keyed by "VESSEL_TYPE". */
function indexDataFiles(dataDir: string): Map<string, FileIndexEntry> {
  const index = new Map<string, FileIndexEntry>();
  const filenames = fs.readdirSync(dataDir);

  for (const filename of filenames) {
    const match = filename.match(FILENAME_PATTERN);
    if (!match) continue; // ignore anything that doesn't fit the pattern

    const vesselId = match[1].toUpperCase() as VesselId;
    const fileType = match[2].toUpperCase() as FileType;
    const key = `${vesselId}_${fileType}`;

    const existing = index.get(key);
    if (existing) {
      // Two files matched the same vessel+type
      throw new Error(
        `Duplicate match for ${key}: "${existing.fullPath}" and "${filename}". ` +
          `Remove the stale file from ${dataDir}.`,
      );
    }

    index.set(key, {
      vesselId,
      fileType,
      fullPath: path.join(dataDir, filename),
    });
  }

  return index;
}

let cachedRows: MergedVesselRow[] | null = null;

/** Parses + merges all 9 files once, then caches the result in memory. */
export function getAllVesselRows(
  dataDir = path.join(process.cwd(), "data"),
): MergedVesselRow[] {
  if (cachedRows) return cachedRows;

  const fileIndex = indexDataFiles(dataDir);

  const rows: MergedVesselRow[] = [];
  const missing: string[] = [];

  for (const vesselId of VESSEL_IDS) {
    const filesByType = {} as Record<FileType, FileIndexEntry | undefined>;
    for (const fileType of FILE_TYPES) {
      filesByType[fileType] = fileIndex.get(`${vesselId}_${fileType}`);
    }

    const missingTypes = FILE_TYPES.filter(
      (fileType) => !filesByType[fileType],
    );
    if (missingTypes.length > 0) {
      missing.push(
        ...missingTypes.map((fileType) => `${vesselId} ${fileType}`),
      );
      continue;
    }

    const readText = (fileType: FileType) =>
      fs.readFileSync(filesByType[fileType]!.fullPath, "utf-8");

    const [gpsText, macs3Text, motionsText] = FILE_TYPES.map(readText);
    const rows = loadVessel(vesselId, gpsText, macs3Text, motionsText);
    rows.push(...rows);
  }

  if (missing.length > 0) {
    console.warn(`getAllVesselRows: missing files for: ${missing.join(", ")}`);
  }

  cachedRows = rows;
  return rows;
}

/** Clears the in-memory cache — useful in tests or if files change at runtime. */
export function resetVesselCache(): void {
  cachedRows = null;
}
