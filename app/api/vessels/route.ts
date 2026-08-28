// GET /api/vessels?vessels=IMO1,IMO2&start=2026-03-01&end=2026-03-15
//
// Returns merged GPS+MOTIONS+MACS3 rows for the requested vessels within the
// given date range. All filtering happens server-side so the client never
// downloads more than the selected window.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAllVesselRows } from "@/lib/csv/dataset";
import { filterMergedRows } from "@/lib/csv/parse-csv";
import { VESSEL_IDS, VesselId } from "@/domain";

// Query params arrive as strings, so we validate+coerce here rather than
// trusting the client. `vessels` is a comma-separated list in the URL
// ("?vessels=IMO1,IMO2"), split before validation so each id is checked
// individually against the enum instead of validating the raw joined string.
const QuerySchema = z
  .object({
    vessels: z
      .string()
      .min(1, "vessels param is required, e.g. ?vessels=IMO1,IMO2")
      .transform((value) => value.split(",").map((v) => v.trim()))
      .pipe(
        z
          .array(z.enum(VESSEL_IDS))
          .min(1, "at least one vessel id is required"),
      ),
    start: z.coerce.date({ message: "start must be a valid date" }),
    end: z.coerce.date({ message: "end must be a valid date" }),
  })
  .refine((data) => data.start <= data.end, {
    message: "start must be before or equal to end",
    path: ["start"],
  });

export async function GET(request: NextRequest) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = QuerySchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        details: z.treeifyError(parsed.error),
      },
      { status: 400 },
    );
  }

  const { vessels, start, end } = parsed.data;

  const allRows = getAllVesselRows();
  const filtered = filterMergedRows(allRows, vessels as VesselId[], start, end);

  return NextResponse.json({
    vessels,
    start: start.toISOString(),
    end: end.toISOString(),
    count: filtered.length,
    data: filtered,
  });
}
