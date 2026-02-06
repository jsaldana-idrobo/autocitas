import React, { useEffect, useState } from "react";
import { BusinessProfile } from "../../types";
import { Badge } from "../../ui/Badge";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "../../ui/DataTable";
import { Pagination } from "../../ui/Pagination";
import { SectionHeader } from "../../ui/SectionHeader";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { PlatformBusinessesTableProps } from "./PlatformBusinessesTable.types";
import { PlatformBusinessModals } from "./PlatformBusinessModals";

export function PlatformBusinessesTable({
  businesses,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
  total
}: PlatformBusinessesTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessProfile | null>(null);
  const [viewingBusiness, setViewingBusiness] = useState<BusinessProfile | null>(null);
  const [deletingBusiness, setDeletingBusiness] = useState<BusinessProfile | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    onRefresh(page, pageSize, debouncedSearch, statusFilter);
  }, [page, pageSize, debouncedSearch, statusFilter, onRefresh]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
      <SectionHeader
        title="Negocios"
        subtitle="Gestiona los negocios de la plataforma."
        actions={
          <>
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onClick={() => onRefresh(page, pageSize, search, statusFilter)}
            >
              Refrescar
            </button>
            <button
              className="rounded-xl bg-primary-600 px-3 py-2 text-sm text-white"
              onClick={() => setCreateOpen(true)}
            >
              Nuevo negocio
            </button>
          </>
        }
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Buscar por nombre o slug"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">Todos</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>

      <div className="mt-4 hidden md:block">
        <DataTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Negocio</TableHeaderCell>
              <TableHeaderCell>Slug</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {businesses.map((business) => (
              <TableRow key={business._id}>
                <TableCell>
                  <div className="font-medium">{business.name}</div>
                  <div className="text-xs text-slate-500">
                    {business.timezone || "America/Bogota"}
                  </div>
                </TableCell>
                <TableCell>{business.slug}</TableCell>
                <TableCell>
                  <Badge tone={business.status === "active" ? "success" : "warning"}>
                    {business.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => setViewingBusiness(business)}
                    >
                      Ver
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => setEditingBusiness(business)}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                      onClick={() => setDeletingBusiness(business)}
                    >
                      Eliminar
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {businesses.length === 0 && (
              <TableRow>
                <TableCell className="text-slate-500" colSpan={4}>
                  No hay negocios para los filtros actuales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </DataTable>
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {businesses.map((business) => (
          <div
            key={business._id}
            className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-slate-900">{business.name}</div>
                <div className="text-xs text-slate-500">{business.slug}</div>
              </div>
              <Badge tone={business.status === "active" ? "success" : "warning"}>
                {business.status === "active" ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {business.timezone || "America/Bogota"}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                onClick={() => setViewingBusiness(business)}
              >
                Ver
              </button>
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                onClick={() => setEditingBusiness(business)}
              >
                Editar
              </button>
              <button
                className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                onClick={() => setDeletingBusiness(business)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {businesses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
            No hay negocios para los filtros actuales.
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

      <PlatformBusinessModals
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        editingBusiness={editingBusiness}
        setEditingBusiness={setEditingBusiness}
        viewingBusiness={viewingBusiness}
        setViewingBusiness={setViewingBusiness}
        deletingBusiness={deletingBusiness}
        setDeletingBusiness={setDeletingBusiness}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </section>
  );
}
