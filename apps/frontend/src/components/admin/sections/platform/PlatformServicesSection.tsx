import React, { useEffect, useMemo, useState } from "react";
import { ServiceItem } from "../../types";
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
import type { PlatformServicesSectionProps } from "./PlatformServicesSection.types";
import { PlatformServicesModals } from "./PlatformServicesModals";

export function PlatformServicesSection({
  services,
  resources,
  businesses,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
  total,
  authHeaders
}: PlatformServicesSectionProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [businessFilter, setBusinessFilter] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [durationMax, setDurationMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [deletingService, setDeletingService] = useState<ServiceItem | null>(null);
  const [viewingService, setViewingService] = useState<ServiceItem | null>(null);
  const [createBusinessId, setCreateBusinessId] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);

  const businessLookup = useMemo(() => {
    return new Map(businesses.map((business) => [business._id ?? "", business.name ?? ""]));
  }, [businesses]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, businessFilter, durationMin, durationMax, priceMin, priceMax]);

  useEffect(() => {
    onRefresh({
      page,
      limit: pageSize,
      search: debouncedSearch,
      active: statusFilter,
      businessId: businessFilter,
      minDuration: durationMin,
      maxDuration: durationMax,
      minPrice: priceMin,
      maxPrice: priceMax
    });
  }, [
    page,
    pageSize,
    debouncedSearch,
    statusFilter,
    businessFilter,
    durationMin,
    durationMax,
    priceMin,
    priceMax,
    onRefresh
  ]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
      <SectionHeader
        title="Servicios"
        subtitle="Administra los servicios de todos los negocios."
        actions={
          <>
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onClick={() =>
                onRefresh({
                  page,
                  limit: pageSize,
                  search,
                  active: statusFilter,
                  businessId: businessFilter,
                  minDuration: durationMin,
                  maxDuration: durationMax,
                  minPrice: priceMin,
                  maxPrice: priceMax
                })
              }
            >
              Refrescar
            </button>
            <button
              className="rounded-xl bg-primary-600 px-3 py-2 text-sm text-white"
              onClick={() => setCreateOpen(true)}
            >
              Nuevo servicio
            </button>
          </>
        }
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Buscar por nombre"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={businessFilter}
          onChange={(event) => setBusinessFilter(event.target.value)}
        >
          <option value="">Todos los negocios</option>
          {businesses.map((business) => (
            <option key={business._id} value={business._id}>
              {business.name ?? business._id}
            </option>
          ))}
        </select>
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          type="number"
          placeholder="Duracion min"
          value={durationMin}
          onChange={(event) => setDurationMin(event.target.value)}
        />
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          type="number"
          placeholder="Duracion max"
          value={durationMax}
          onChange={(event) => setDurationMax(event.target.value)}
        />
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          type="number"
          placeholder="Precio min"
          value={priceMin}
          onChange={(event) => setPriceMin(event.target.value)}
        />
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          type="number"
          placeholder="Precio max"
          value={priceMax}
          onChange={(event) => setPriceMax(event.target.value)}
        />
      </div>

      <div className="mt-4 hidden md:block">
        <DataTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Negocio</TableHeaderCell>
              <TableHeaderCell>Servicio</TableHeaderCell>
              <TableHeaderCell>Duracion</TableHeaderCell>
              <TableHeaderCell>Precio</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service._id}>
                <TableCell>
                  {service.businessId
                    ? businessLookup.get(service.businessId) || service.businessId
                    : "-"}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{service.name}</div>
                </TableCell>
                <TableCell>{service.durationMinutes} min</TableCell>
                <TableCell>${service.price ?? "-"}</TableCell>
                <TableCell>
                  <Badge tone={service.active ? "success" : "warning"}>
                    {service.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => setViewingService(service)}
                    >
                      Ver
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => setEditingService(service)}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => {
                        if (!service.businessId) return;
                        onUpdate(service.businessId, service._id, { active: !service.active });
                      }}
                    >
                      {service.active ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                      onClick={() => setDeletingService(service)}
                    >
                      Eliminar
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {services.length === 0 && (
              <TableRow>
                <TableCell className="text-slate-500" colSpan={6}>
                  No hay servicios para los filtros actuales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </DataTable>
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {services.map((service) => (
          <div key={service._id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-slate-500">
                  {service.businessId
                    ? businessLookup.get(service.businessId) || service.businessId
                    : "-"}
                </div>
                <div className="text-base font-semibold text-slate-900">{service.name}</div>
                <div className="text-xs text-slate-500">
                  {service.durationMinutes} min · ${service.price ?? "-"}
                </div>
              </div>
              <Badge tone={service.active ? "success" : "warning"}>
                {service.active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                onClick={() => setViewingService(service)}
              >
                Ver
              </button>
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                onClick={() => setEditingService(service)}
              >
                Editar
              </button>
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                onClick={() => {
                  if (!service.businessId) return;
                  onUpdate(service.businessId, service._id, { active: !service.active });
                }}
              >
                {service.active ? "Desactivar" : "Activar"}
              </button>
              <button
                className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                onClick={() => setDeletingService(service)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
            No hay servicios para los filtros actuales.
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

      <PlatformServicesModals
        businesses={businesses}
        businessLookup={businessLookup}
        resources={resources}
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        createBusinessId={createBusinessId}
        setCreateBusinessId={setCreateBusinessId}
        editingService={editingService}
        setEditingService={setEditingService}
        viewingService={viewingService}
        setViewingService={setViewingService}
        deletingService={deletingService}
        setDeletingService={setDeletingService}
        authHeaders={authHeaders}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </section>
  );
}
