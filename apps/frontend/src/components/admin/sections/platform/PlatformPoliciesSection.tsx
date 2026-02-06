import React, { useMemo, useState } from "react";
import { BusinessProfile, Policies } from "../../types";
import { InputField } from "../../components/InputField";
import { Modal } from "../../ui/Modal";
import { Pagination } from "../../ui/Pagination";
import { SectionHeader } from "../../ui/SectionHeader";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "../../ui/DataTable";

export function PlatformPoliciesSection({
  businesses,
  onSavePolicies,
  onRefresh,
  total
}: Readonly<{
  businesses: BusinessProfile[];
  onSavePolicies: (businessId: string, payload: Policies) => void;
  onRefresh: (page?: number, limit?: number) => void;
  total: number;
}>) {
  const [editingBusiness, setEditingBusiness] = useState<BusinessProfile | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const rows = useMemo(() => {
    return businesses.map((business) => ({
      id: business._id ?? "",
      name: business.name ?? business._id ?? "",
      policies: business.policies ?? {
        cancellationHours: 24,
        rescheduleLimit: 1,
        allowSameDay: true
      }
    }));
  }, [businesses]);

  React.useEffect(() => {
    onRefresh(page, pageSize);
  }, [page, pageSize, onRefresh]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
      <SectionHeader
        title="Politicas"
        subtitle="Politicas por negocio."
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
              <TableHeaderCell>Cancelacion</TableHeaderCell>
              <TableHeaderCell>Reprogramacion</TableHeaderCell>
              <TableHeaderCell>Mismo dia</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="font-medium">{row.name}</div>
                </TableCell>
                <TableCell>{row.policies.cancellationHours} horas</TableCell>
                <TableCell>{row.policies.rescheduleLimit}</TableCell>
                <TableCell>{row.policies.allowSameDay ? "Permitido" : "No"}</TableCell>
                <TableCell className="text-right">
                  <button
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                    onClick={() => {
                      const target = businesses.find((item) => item._id === row.id) ?? null;
                      setEditingBusiness(target);
                    }}
                  >
                    Editar politicas
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell className="text-slate-500" colSpan={5}>
                  No hay negocios registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </DataTable>
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {rows.map((row) => (
          <div key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="text-base font-semibold text-slate-900">{row.name}</div>
            <div className="mt-2 text-xs text-slate-500">
              Cancelacion: {row.policies.cancellationHours} horas
            </div>
            <div className="text-xs text-slate-500">
              Reprogramacion: {row.policies.rescheduleLimit}
            </div>
            <div className="text-xs text-slate-500">
              Mismo dia: {row.policies.allowSameDay ? "Permitido" : "No"}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                onClick={() => {
                  const target = businesses.find((item) => item._id === row.id) ?? null;
                  setEditingBusiness(target);
                }}
              >
                Editar politicas
              </button>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
            No hay negocios registrados.
          </div>
        )}
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
        title={`Editar politicas · ${editingBusiness?.name ?? ""}`}
        onClose={() => setEditingBusiness(null)}
      >
        {editingBusiness && (
          <form
            key={editingBusiness._id}
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const readString = (key: string) => {
                const value = form.get(key);
                return typeof value === "string" ? value.trim() : "";
              };
              const payload: Policies = {
                cancellationHours: Number(readString("cancellationHours")),
                rescheduleLimit: Number(readString("rescheduleLimit")),
                allowSameDay: readString("allowSameDay") === "true"
              };
              if (!editingBusiness._id) return;
              onSavePolicies(editingBusiness._id, payload);
              setEditingBusiness(null);
            }}
          >
            <InputField
              name="cancellationHours"
              label="Horas cancelacion"
              type="number"
              defaultValue={editingBusiness.policies?.cancellationHours ?? 24}
            />
            <InputField
              name="rescheduleLimit"
              label="Limite reprogramacion"
              type="number"
              defaultValue={editingBusiness.policies?.rescheduleLimit ?? 1}
            />
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                name="allowSameDay"
                type="checkbox"
                defaultChecked={editingBusiness.policies?.allowSameDay ?? true}
              />
              <span>Permitir mismo dia</span>
            </label>
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
