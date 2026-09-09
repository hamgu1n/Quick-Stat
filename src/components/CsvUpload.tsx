import { useState } from "react";
import { Upload, FolderOpen, FileText } from "lucide-react";
import { type Dataset } from "@/types/dataset";
import { SAMPLE_DATASETS } from "@/lib/sampleDatasets";

export function CsvUpload({
  onDatasetLoad,
  variant = "prominent",
  loaded = false,
}: {
  onDatasetLoad: (dataset: Dataset) => void;
  variant?: "prominent" | "compact";
  /** Whether a dataset is already loaded (e.g. by a sibling CsvUpload elsewhere on the page). */
  loaded?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [datasetLoaded, setDatasetLoaded] = useState(false);
  const [sampleLoading, setSampleLoading] = useState<string | null>(null);
  const isLoaded = loaded || datasetLoaded;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset the input so choosing the same file again still fires onChange.
    e.target.value = "";
    if (!file) return;

    const errorMessage = checkCSVError(file);
    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    setError(null);
    readCSV(file)
      .then((dataset) => {
        onDatasetLoad(dataset);
        setDatasetLoaded(true);
      })
      .catch((error) => {
        setError(error instanceof Error ? error.message : "Couldn't read that file.");
      });
  }

  function loadSample(id: string) {
    const sample = SAMPLE_DATASETS.find((s) => s.id === id);
    if (!sample) return;
    setError(null);
    setSampleLoading(id);
    fetch(`${import.meta.env.BASE_URL}sample-data/${sample.file}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Couldn't load "${sample.name}" (${res.status}).`);
        return res.text();
      })
      .then((text) => {
        onDatasetLoad(parseCSV(text));
        setDatasetLoaded(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Couldn't load that sample dataset.");
      })
      .finally(() => setSampleLoading(null));
  }

  return (
    <div className={`csv-upload csv-upload--${variant}`}>
      <label className={variant === "prominent" ? "csv-upload-button" : "ribbon-btn"}>
        {variant === "prominent" ? (
          <>
            <Upload size={18} strokeWidth={2} />
            <span>Upload CSV</span>
          </>
        ) : (
          <>
            {isLoaded ? <FolderOpen size={20} strokeWidth={1.75} /> : <Upload size={20} strokeWidth={1.75} />}
            <span>{isLoaded ? "Replace" : "Upload"}</span>
          </>
        )}
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            handleFile(e);
          }}
        />
      </label>
      {variant === "prominent" && (
        <>
          <p className="csv-upload-hint">Upload a CSV to explore it: view your data, see summary statistics, run a
            statistical test, or chart a column.</p>
          <div className="csv-upload-samples">
            <span className="csv-upload-samples-label">Or try a sample dataset:</span>
            <div className="csv-upload-samples-list">
              {SAMPLE_DATASETS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  className="csv-upload-sample-btn"
                  disabled={sampleLoading !== null}
                  onClick={() => loadSample(sample.id)}
                  title={sample.description}
                >
                  <FileText size={14} strokeWidth={2} />
                  {sampleLoading === sample.id ? "Loading…" : sample.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      {error && <p className="csv-upload-message csv-upload-message--error">{error}</p>}
      {!error && datasetLoaded && variant === "compact" && (
        <p className="csv-upload-message csv-upload-message--success">Uploaded.</p>
      )}
    </div>
  );
}

function readCSV(file: File): Promise<Dataset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        resolve(parseCSV(text));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Couldn't read that file - it may be corrupted or unreadable."));
    reader.readAsText(file);
  });
}

/**
 * Parses raw CSV text into a Dataset. Handles the messy real-world cases a
 * naive `split(",")` doesn't: quoted fields (with embedded commas,
 * newlines, and escaped `""` quotes), `\r\n` line endings, blank trailing
 * lines, and rows that are longer/shorter than the header row.
 */
function parseCSV(text: string): Dataset {
  const rows = tokenizeCSV(text);
  if (rows.length === 0) {
    throw new Error("This file is empty.");
  }

  const headers = rows[0].map((h) => h.trim());
  if (headers.every((h) => h === "")) {
    throw new Error("Couldn't find a header row - is the first line the column names?");
  }

  const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell.trim() !== ""));
  if (dataRows.length === 0) {
    throw new Error("This file has a header row but no data rows.");
  }

  // Normalize every row to the header width so every column lookup
  // downstream (DataTable, columnStats, test runners) can index safely
  // without extra bounds checks.
  const normalized = dataRows.map((row) => {
    const cells = row.slice(0, headers.length).map((c) => c.trim());
    while (cells.length < headers.length) cells.push("");
    return cells;
  });

  return { headers, rows: normalized };
}

/** Minimal RFC 4180 tokenizer: splits CSV text into rows of raw string
 * cells, respecting quoted fields so commas/newlines inside quotes don't
 * break the row/column boundaries. */
function tokenizeCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\r") {
      // ignore; \n (or EOF) ends the row
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  // Flush a trailing field/row if the file doesn't end with a newline.
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function checkCSVError(file: File): string | null {
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return "Please upload a .csv file.";
  }
  if (file.size === 0) {
    return "This file is empty.";
  }
  return null;
}
