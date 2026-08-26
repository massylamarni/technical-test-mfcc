import { useEffect, useState } from "react";
import { MergedVesselRow, groupRowsByVessel } from "@/lib/csv/parse-csv";
import { VesselId } from "@/domain";

interface ApiResponse {
  vessels: VesselId[];
  start: string;
  end: string;
  count: number;
  data: MergedVesselRow[];
}

interface UseVesselDataResult {
  rowsByVessel: Record<VesselId, MergedVesselRow[]>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches /api/vessels for the given vessel selection + date range, and
 * returns the result already grouped per vessel (via groupRowsByVessel) —
 * this is the "group right before rendering" boundary we agreed on earlier;
 * the flat array stays the API's shape, grouping happens on the client.
 */
const EMPTY_ROWS: Record<VesselId, MergedVesselRow[]> = {
  IMO1: [],
  IMO2: [],
  IMO3: [],
};

export function useVesselData(
  vesselIds: VesselId[],
  startDate: Date | null,
  endDate: Date | null,
): UseVesselDataResult {
  // Only ever holds data from a successful fetch — the "nothing selected /
  // invalid range" case is handled below at render time (see rowsByVessel),
  // not via setState, since it isn't synchronizing with anything external.
  const [fetchedRows, setFetchedRows] =
    useState<Record<VesselId, MergedVesselRow[]>>(EMPTY_ROWS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidSelection =
    vesselIds.length > 0 && startDate !== null && endDate !== null;

  useEffect(() => {
    if (!isValidSelection) return;

    const controller = new AbortController();

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          vessels: vesselIds.join(","),
          start: startDate!.toISOString(),
          end: endDate!.toISOString(),
        });

        const res = await fetch(`/api/vessels?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body?.error ?? `Request failed with status ${res.status}`,
          );
        }

        const json: ApiResponse = await res.json();
        const rows = json.data.map((r) => ({ ...r, date: new Date(r.date) }));
        setFetchedRows(groupRowsByVessel(rows));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Failed to load vessel data",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, [isValidSelection, vesselIds, startDate, endDate]);

  // Derived at render time, not stored in state: if the current selection is
  // invalid, show empty regardless of whatever was fetched previously — no
  // effect/setState round-trip needed to represent that.
  const rowsByVessel = isValidSelection ? fetchedRows : EMPTY_ROWS;

  return { rowsByVessel, isLoading, error };
}
