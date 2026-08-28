export const VESSEL_IDS = ["IMO1", "IMO2", "IMO3"] as const;
export type VesselId = (typeof VESSEL_IDS)[number];
export const FILE_TYPES = ["GPS", "MACS3", "MOTIONS"] as const;
export const VESSEL_FILENAME_MAP = {
  IMO1: "III",
  IMO2: "AAA",
  IMO3: "LLL",
};
export const DEFAULT_START = "2026-01-01";
export const DEFAULT_END = "2026-12-31";
