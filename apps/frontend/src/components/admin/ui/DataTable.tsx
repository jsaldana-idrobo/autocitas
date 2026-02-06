import React from "react";

/* eslint-disable react/prop-types */

export function DataTable({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: Readonly<{ children: React.ReactNode }>) {
  return <thead className="bg-slate-50 text-xs uppercase text-slate-500">{children}</thead>;
}

export function TableBody({ children }: Readonly<{ children: React.ReactNode }>) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function TableRow({ children }: Readonly<{ children: React.ReactNode }>) {
  return <tr className="hover:bg-slate-50">{children}</tr>;
}

export function TableCell({
  children,
  className,
  ...rest
}: Readonly<React.TdHTMLAttributes<HTMLTableCellElement>>) {
  return (
    <td className={`px-4 py-3 ${className ?? ""}`} {...rest}>
      {children}
    </td>
  );
}

export function TableHeaderCell({
  children,
  className,
  ...rest
}: Readonly<React.ThHTMLAttributes<HTMLTableCellElement>>) {
  return (
    <th className={`px-4 py-3 font-semibold ${className ?? ""}`} {...rest}>
      {children}
    </th>
  );
}
