import React, { useState } from "react";
import { BusinessHoursItem, dayLabels } from "../../types";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "../../ui/DataTable";
import { Modal } from "../../ui/Modal";
import { Pagination } from "../../ui/Pagination";
import { SectionHeader } from "../../ui/SectionHeader";

export function HoursSection({
  hours,
  saveHours
}: {
  hours: BusinessHoursItem[];
  saveHours: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const rows = dayLabels.map((label, index) => {
    const current = hours.find((item) => item.dayOfWeek === index);
    return {
      label,
      openTime: current?.openTime ?? "-",
      closeTime: current?.closeTime ?? "-"
    };
  });

  const pageItems = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <SectionHeader
        title="Horarios"
        subtitle="Define los horarios de atencion."
        actions={
          <button
            className="rounded-xl bg-primary-600 px-3 py-2 text-sm text-white"
            onClick={() => setEditOpen(true)}
          >
            Editar horarios
          </button>
        }
      />

      <div className="mt-4">
        <DataTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Dia</TableHeaderCell>
              <TableHeaderCell>Apertura</TableHeaderCell>
              <TableHeaderCell>Cierre</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageItems.map((row) => (
              <TableRow key={row.label}>
                <TableCell>{row.label}</TableCell>
                <TableCell>{row.openTime}</TableCell>
                <TableCell>{row.closeTime}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      </div>

      <Pagination
        total={rows.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setPage(1);
        }}
      />

      <Modal open={editOpen} title="Editar horarios" onClose={() => setEditOpen(false)}>
        <form
          key={
            hours.length
              ? hours
                  .map((item) => `${item.dayOfWeek}:${item.openTime}:${item.closeTime}`)
                  .join("|")
              : "hours"
          }
          className="space-y-3"
          onSubmit={(event) => {
            saveHours(event);
            setEditOpen(false);
          }}
        >
          {dayLabels.map((label, index) => {
            const current = hours.find((item) => item.dayOfWeek === index);
            return (
              <div key={label} className="grid grid-cols-3 gap-2">
                <div className="self-center text-sm font-medium">{label}</div>
                <input
                  name={`open-${index}`}
                  placeholder="09:00"
                  defaultValue={current?.openTime ?? ""}
                  className="rounded-xl border border-slate-200 px-3 py-2"
                />
                <input
                  name={`close-${index}`}
                  placeholder="18:00"
                  defaultValue={current?.closeTime ?? ""}
                  className="rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
            );
          })}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
              onClick={() => setEditOpen(false)}
            >
              Cancelar
            </button>
            <button
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm text-white"
              type="submit"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
