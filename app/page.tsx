import { getAllVesselRows } from "@/lib/csv/dataset";
import { filterMergedRows } from "@/lib/csv/parse-csv";

export default function Home() {
  const vesselRows = getAllVesselRows();
  const filtered = filterMergedRows(vesselRows, ["III", "AAA"]);

  return <div>RUNNING</div>;
}
