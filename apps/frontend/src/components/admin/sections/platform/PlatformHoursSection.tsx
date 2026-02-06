import React, { useMemo, useState } from "react";
import { BusinessHoursItem, BusinessProfile, dayLabels } from "../../types";
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
import { readFormString } from "../../hooks/shared/utils";
import { EmptyCard, EmptyTableRow } from "../shared/EmptyState";

export function PlatformHoursSection({
  businesses,
  onSaveHours,
  onRefresh,
  total
}: Readonly<{
  businesses: BusinessProfile[];
  onSaveHours: (businessId: string, payload: BusinessHoursItem[]) => void;
  onRefresh: (page?: number, limit?: number) => void;
  total: number;
}>) {
  const [editingBusiness, setEditingBusiness] = useState<BusinessProfile | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const businessRows = useMemo(() => {
    return businesses.map((business) => ({
      id: business._id ?? "",
      name: business.name ?? business._id ?? "",
      timezone: business.timezone ?? "America/Bogota",
      hours: business.hours ?? []
    }));
  }, [businesses]);

  React.useEffect(() => {
    onRefresh(page, pageSize);
  }, [page, pageSize, onRefresh]);

  const emptyLabel = "No hay negocios registrados.";

  const handleEdit = (businessId: string) => {
    const target = businesses.find((item) => item._id === businessId) ?? null;
    setEditingBusiness(target);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
      <SectionHeader
        title="Horarios"
        subtitle="Horarios por negocio."
        actions={
          <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            {total} negocios
          </button>
        }
      />

      <div className="mt-4 hidden md:block">
        <DataTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Negocio</TableHeaderCell>
              <TableHeaderCell>Timezone</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {businessRows.map((business) => (
              <TableRow key={business.id}>
                <TableCell>
                  <div className="font-medium">{business.name}</div>
                </TableCell>
                <TableCell>{business.timezone}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => handleEdit(business.id)}
                    >
                      Editar horarios
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {businessRows.length === 0 && <EmptyTableRow colSpan={3} label={emptyLabel} />}
          </TableBody>
        </DataTable>
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {businessRows.map((business) => (
          <div key={business.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="text-base font-semibold text-slate-900">{business.name}</div>
            <div className="text-xs text-slate-500">{business.timezone}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                onClick={() => handleEdit(business.id)}
              >
                Editar horarios
              </button>
            </div>
          </div>
        ))}
        {businessRows.length === 0 && <EmptyCard label={emptyLabel} />}
      </div>

      <Pagination
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setPage(1);
        }}
      />

      <Modal
        open={Boolean(editingBusiness)}
        title={`Editar horarios · ${editingBusiness?.name ?? ""}`}
        onClose={() => setEditingBusiness(null)}
      >
        {editingBusiness && (
          <form
            key={editingBusiness._id}
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const payloadHours = dayLabels
                .map((_, index) => {
                  const openTime = readFormString(form, `open-${index}`);
                  const closeTime = readFormString(form, `close-${index}`);
                  if (!openTime && !closeTime) {
                    return null;
                  }
                  if (!openTime || !closeTime) {
                    return null;
                  }
                  return { dayOfWeek: index, openTime, closeTime };
                })
                .filter(
                  (item): item is { dayOfWeek: number; openTime: string; closeTime: string } =>
                    Boolean(item)
                );
              if (!editingBusiness._id) return;
              onSaveHours(editingBusiness._id, payloadHours);
              setEditingBusiness(null);
            }}
          >
            {dayLabels.map((label, index) => {
              const current = editingBusiness.hours?.find((item) => item.dayOfWeek === index);
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
                onClick={() => setEditingBusiness(null)}
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
        )}
      </Modal>
    </section>
  );
}
