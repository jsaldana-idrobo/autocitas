import React, { useEffect, useMemo, useState } from "react";
import { ResourceItem } from "../../types";
import { Pagination } from "../../ui/Pagination";
import { SectionHeader } from "../../ui/SectionHeader";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { PlatformResourcesModals } from "./PlatformResourcesModals";
import type { PlatformResourcesSectionProps } from "./PlatformResourcesSection.types";
import { ResourcesList } from "../shared/ResourcesList";

export function PlatformResourcesSection({
  resources,
  businesses,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
  total,
  authHeaders
}: PlatformResourcesSectionProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [businessFilter, setBusinessFilter] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [deletingResource, setDeletingResource] = useState<ResourceItem | null>(null);
  const [viewingResource, setViewingResource] = useState<ResourceItem | null>(null);
  const [createBusinessId, setCreateBusinessId] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);

  const businessLookup = useMemo(() => {
    return new Map(businesses.map((business) => [business._id ?? "", business.name ?? ""]));
  }, [businesses]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, businessFilter]);

  useEffect(() => {
    onRefresh(page, pageSize, debouncedSearch, statusFilter, businessFilter);
  }, [page, pageSize, debouncedSearch, statusFilter, businessFilter, onRefresh]);

  const sorted = useMemo(() => {
    const base = [...resources];
    return base.sort((a, b) => {
      if (sortBy === "name_desc") {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === "status") {
        return Number(b.active) - Number(a.active);
      }
      return a.name.localeCompare(b.name);
    });
  }, [resources, sortBy]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
      <SectionHeader
        title="Recursos"
        subtitle="Gestiona los recursos de todos los negocios."
        actions={
          <>
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onClick={() => onRefresh(page, pageSize, search, statusFilter, businessFilter)}
            >
              Refrescar
            </button>
            <button
              className="rounded-xl bg-primary-600 px-3 py-2 text-sm text-white"
              onClick={() => setCreateOpen(true)}
            >
              Nuevo recurso
            </button>
          </>
        }
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Buscar por nombre o ID"
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
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
        >
          <option value="name_asc">Nombre A-Z</option>
          <option value="name_desc">Nombre Z-A</option>
          <option value="status">Estado</option>
        </select>
      </div>

      <ResourcesList
        resources={sorted}
        emptyLabel="No hay recursos para los filtros actuales."
        showBusiness
        businessLookup={businessLookup}
        onView={setViewingResource}
        onEdit={setEditingResource}
        onToggleActive={(resource) => {
          if (!resource.businessId) return;
          onUpdate(resource.businessId, resource._id, { active: !resource.active });
        }}
        onDelete={setDeletingResource}
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

      <PlatformResourcesModals
        businesses={businesses}
        businessLookup={businessLookup}
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        createBusinessId={createBusinessId}
        setCreateBusinessId={setCreateBusinessId}
        editingResource={editingResource}
        setEditingResource={setEditingResource}
        viewingResource={viewingResource}
        setViewingResource={setViewingResource}
        deletingResource={deletingResource}
        setDeletingResource={setDeletingResource}
        authHeaders={authHeaders}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </section>
  );
}
