import React, { useEffect, useState } from "react";
import { ServiceItem } from "../../types";
import { Pagination } from "../../ui/Pagination";
import { SectionHeader } from "../../ui/SectionHeader";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { ServicesModals } from "./ServicesModals";
import type { ServicesSectionProps } from "./ServicesSection.types";
import { ServicesList } from "../shared/ServicesList";

export function ServicesSection({
  services,
  resources,
  createService,
  updateService,
  deleteService,
  loadServices,
  ensureResourcesLoaded,
  total
}: ServicesSectionProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [deletingService, setDeletingService] = useState<ServiceItem | null>(null);
  const [viewingService, setViewingService] = useState<ServiceItem | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    loadServices(page, pageSize, debouncedSearch, statusFilter);
  }, [page, pageSize, debouncedSearch, statusFilter, loadServices]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
      <SectionHeader
        title="Servicios"
        subtitle="Crea y administra los servicios de tu negocio."
        actions={
          <>
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onClick={() => loadServices(page, pageSize, search, statusFilter)}
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
      </div>

      <ServicesList
        services={services}
        emptyLabel="No hay servicios para los filtros actuales."
        onView={setViewingService}
        onEdit={(service) => {
          ensureResourcesLoaded();
          setEditingService(service);
        }}
        onToggleActive={(service) => updateService(service._id, { active: !service.active })}
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

      <ServicesModals
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        editingService={editingService}
        setEditingService={setEditingService}
        viewingService={viewingService}
        setViewingService={setViewingService}
        deletingService={deletingService}
        setDeletingService={setDeletingService}
        resources={resources}
        createService={createService}
        updateService={updateService}
        deleteService={deleteService}
      />
    </section>
  );
}
