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

export function PlatformHoursSection({
  businesses,
  onSaveHours,
  onRefresh,
  total
}: {
  businesses: BusinessProfile[];
  onSaveHours: (businessId: string, payload: BusinessHoursItem[]) => void;
  onRefresh: (page?: number, limit?: number) => void;
  total: number;
}) {
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

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <SectionHeader
        title="Horarios"
        subtitle="Horarios por negocio."
        actions={
          <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            {total} negocios
          </button>
        }
      />

      <div className="mt-4">
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
                      onClick={() => {
                        const target = businesses.find((item) => item._id === business.id) ?? null;
                        setEditingBusiness(target);
                      }}
                    >
                      Editar horarios
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {businessRows.length === 0 && (
              <TableRow>
                <TableCell className="text-slate-500" colSpan={3}>
                  No hay negocios registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </DataTable>
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
              const readString = (key: string) => {
                const value = form.get(key);
                return typeof value === "string" ? value.trim() : "";
              };
              const payloadHours = dayLabels
                .map((_, index) => {
                  const openTime = readString(`open-${index}`);
                  const closeTime = readString(`close-${index}`);
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
