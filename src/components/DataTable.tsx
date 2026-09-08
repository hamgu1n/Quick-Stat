import { useMemo } from "react";
import { type Dataset } from "@/types/dataset";
import { getColumnValues, inferColumnType } from "@/lib/columnStats";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DataTable({ dataset }: { dataset: Dataset }) {
  const columnTypes = useMemo(
    () =>
      dataset.headers.map((_, i) =>
        inferColumnType(getColumnValues(dataset.rows, i)),
      ),
    [dataset],
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {dataset.headers.map((header, i) => (
            <TableHead key={header}>
              <div className="data-table-header">
                <span>{header}</span>
                <span className={`column-type-badge column-type-badge--${columnTypes[i]}`}>
                  {columnTypes[i] === "numeric" ? "Numeric" : "Categorical"}
                </span>
              </div>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {dataset.rows.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <TableCell key={cellIndex}>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
