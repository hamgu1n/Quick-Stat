import { useState } from "react";
import { type Dataset } from "@/types/dataset";

export function CsvUpload({
  onDatasetLoad,
}: {
  onDatasetLoad: (dataset: Dataset) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [datasetLoaded, setDatasetLoaded] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const errorMessage = checkCSVError(file);
    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    readCSV(file)
      .then((dataset) => {
        onDatasetLoad(dataset);
        setDatasetLoaded(true);
      })
      .catch((error) => {
        setError(`Error reading CSV: ${error.message}`);
      });
  }
  return (
    <>
      <h2>CSV Upload Component</h2>
      <input
        type="file"
        onChange={(e) => {
          handleFile(e);
        }}
      />
      {(error && <p style={{ color: "red" }}>{error}</p>) ||
        (datasetLoaded && (
          <p style={{ color: "green" }}>CSV file uploaded successfully!</p>
        ))}
    </>
  );
}

function readCSV(file: File): Promise<Dataset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const dataset = parseCSV(text);
      resolve(dataset);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}

function parseCSV(text: string): Dataset {
  const lines = text.split("\n").map((line) => line.trim());
  const headers = lines[0].split(",").map((header) => header.trim());
  const rows = lines
    .slice(1)
    .map((line) => line.split(",").map((cell) => cell.trim()));
  return { headers, rows };
}

function checkCSVError(file: File): string | null {
  if (file.type !== "text/csv") {
    return "Please upload a valid CSV file.";
  }
  return null;
}
