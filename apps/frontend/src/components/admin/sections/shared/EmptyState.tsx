import React from "react";
import { TableCell, TableRow } from "../../ui/DataTable";

type EmptyTableRowProps = Readonly<{
  colSpan: number;
  label: string;
}>;

type EmptyCardProps = Readonly<{
  label: string;
}>;

export function EmptyTableRow({ colSpan, label }: EmptyTableRowProps) {
  return (
    <TableRow>
      <TableCell className="text-slate-500" colSpan={colSpan}>
        {label}
      </TableCell>
    </TableRow>
  );
}

export function EmptyCard({ label }: EmptyCardProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
      {label}
    </div>
  );
}
