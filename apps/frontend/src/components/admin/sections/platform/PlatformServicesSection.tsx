import React, { useEffect, useMemo, useState } from "react";
import { ServiceItem } from "../../types";
import { Pagination } from "../../ui/Pagination";
import { SectionHeader } from "../../ui/SectionHeader";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { PlatformServicesSectionProps } from "./PlatformServicesSection.types";
import { PlatformServicesModals } from "./PlatformServicesModals";
import { ServicesList } from "../shared/ServicesList";

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

      <ServicesList
        services={services}
        emptyLabel="No hay servicios para los filtros actuales."
        showBusiness
        businessLookup={businessLookup}
        onView={setViewingService}
        onEdit={setEditingService}
        onToggleActive={(service) => {
          if (!service.businessId) return;
          onUpdate(service.businessId, service._id, { active: !service.active });
        }}
        onDelete={setDeletingService}
      />

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
