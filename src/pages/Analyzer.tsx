import { CsvUpload } from "@/components/CsvUpload";
import { DataTable } from "@/components/DataTable";
import type { Dataset } from "@/types/dataset";
import { useState } from "react";

export default function Analyzer() {
  const [dataset, setDataset] = useState<Dataset | null>(null);

  return (
    <div>
      <h1>Analyzer</h1>
      <h1> Welcome to Quick Stat</h1>
      <CsvUpload onDatasetLoad={setDataset} />
      {dataset && <DataTable dataset={dataset} />}
    </div>
  );
}
