import React from "react";

export function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange
}: Readonly<{
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (value: number) => void;
  onPageSizeChange: (value: number) => void;
}>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
      <div>
        Mostrando {start}-{end} de {total}
      </div>
      <div className="flex items-center gap-2">
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <button
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          Anterior
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
