import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../../../lib/api";
import { BlockItem, PaginatedResponse, ResourceItem } from "../../types";
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
import type { PlatformBlocksSectionProps } from "./PlatformBlocksSection.types";
import { PlatformBlocksFilters } from "./PlatformBlocksFilters";
import { PlatformBlocksModals } from "./PlatformBlocksModals";

export function PlatformBlocksSection({
  blocks,
  resources,
  businesses,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
  total,
  authHeaders
}: PlatformBlocksSectionProps) {
  const [search, setSearch] = useState("");
  const [businessFilter, setBusinessFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockItem | null>(null);
  const [deletingBlock, setDeletingBlock] = useState<BlockItem | null>(null);
  const [viewingBlock, setViewingBlock] = useState<BlockItem | null>(null);
  const [createBusinessId, setCreateBusinessId] = useState("");
  const [createResourceId, setCreateResourceId] = useState("");
  const [createResources, setCreateResources] = useState<ResourceItem[]>([]);
  const [createResourcesLoading, setCreateResourcesLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 400);

  const businessLookup = useMemo(() => {
    return new Map(businesses.map((business) => [business._id ?? "", business.name ?? ""]));
  }, [businesses]);

  const filteredResources = useMemo(() => {
    if (!createBusinessId) return [];
    if (createResources.length > 0) return createResources;
    return resources.filter((resource) => resource.businessId === createBusinessId);
  }, [resources, createBusinessId, createResources]);

  useEffect(() => {
    if (!createBusinessId) {
      setCreateResources([]);
      setCreateResourceId("");
      return;
    }
    let active = true;
    setCreateResourcesLoading(true);
    apiRequest<PaginatedResponse<ResourceItem>>(
      `/admin/platform/resources?businessId=${createBusinessId}&active=true&page=1&limit=200`,
      authHeaders
    )
      .then((data) => {
        if (!active) return;
        const items = "items" in data ? data.items : [];
        setCreateResources(items);
      })
      .catch(() => {
        if (!active) return;
        setCreateResources([]);
      })
      .finally(() => {
        if (!active) return;
        setCreateResourcesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authHeaders, createBusinessId]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, businessFilter, resourceFilter, typeFilter, fromFilter, toFilter]);

  useEffect(() => {
    onRefresh({
      page,
      limit: pageSize,
      businessId: businessFilter,
      resourceId: resourceFilter,
      search: debouncedSearch,
      type: typeFilter,
      from: fromFilter,
      to: toFilter
    });
  }, [
    page,
    pageSize,
    businessFilter,
    resourceFilter,
    debouncedSearch,
    typeFilter,
    fromFilter,
    toFilter,
    onRefresh
  ]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <SectionHeader
        title="Bloqueos"
        subtitle="Bloqueos globales por negocio."
        actions={
          <>
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onClick={() =>
                onRefresh({
                  page,
                  limit: pageSize,
                  businessId: businessFilter,
                  resourceId: resourceFilter,
                  search: debouncedSearch,
                  type: typeFilter,
                  from: fromFilter,
                  to: toFilter
                })
              }
            >
              Refrescar
            </button>
            <button
              className="rounded-xl bg-primary-600 px-3 py-2 text-sm text-white"
              onClick={() => setCreateOpen(true)}
            >
              Nuevo bloqueo
            </button>
          </>
        }
      />

      <PlatformBlocksFilters
        search={search}
        setSearch={setSearch}
        businessFilter={businessFilter}
        setBusinessFilter={setBusinessFilter}
        resourceFilter={resourceFilter}
        setResourceFilter={setResourceFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        fromFilter={fromFilter}
        setFromFilter={setFromFilter}
        toFilter={toFilter}
        setToFilter={setToFilter}
        businesses={businesses}
        resources={resources}
      />

      <div className="mt-4">
        <DataTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Negocio</TableHeaderCell>
              <TableHeaderCell>Recurso</TableHeaderCell>
              <TableHeaderCell>Motivo</TableHeaderCell>
              <TableHeaderCell>Inicio</TableHeaderCell>
              <TableHeaderCell>Fin</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {blocks.map((block) => (
              <TableRow key={block._id}>
                <TableCell>
                  {block.businessId
                    ? businessLookup.get(block.businessId) || block.businessId
                    : "-"}
                </TableCell>
                <TableCell>
                  {resources.find((resource) => resource._id === block.resourceId)?.name ||
                    block.resourceId ||
                    "Todos"}
                </TableCell>
                <TableCell>{block.reason || "Bloqueo"}</TableCell>
                <TableCell>{new Date(block.startTime).toLocaleString()}</TableCell>
                <TableCell>{new Date(block.endTime).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => setViewingBlock(block)}
                    >
                      Ver
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => setEditingBlock(block)}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                      onClick={() => setDeletingBlock(block)}
                    >
                      Eliminar
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {blocks.length === 0 && (
              <TableRow>
                <TableCell className="text-slate-500" colSpan={6}>
                  No hay bloqueos para los filtros actuales.
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

      <PlatformBlocksModals
        businesses={businesses}
        businessLookup={businessLookup}
        resources={resources}
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        createBusinessId={createBusinessId}
        setCreateBusinessId={setCreateBusinessId}
        createResourceId={createResourceId}
        setCreateResourceId={setCreateResourceId}
        createResourcesLoading={createResourcesLoading}
        filteredResources={filteredResources}
        editingBlock={editingBlock}
        setEditingBlock={setEditingBlock}
        viewingBlock={viewingBlock}
        setViewingBlock={setViewingBlock}
        deletingBlock={deletingBlock}
        setDeletingBlock={setDeletingBlock}
        authHeaders={authHeaders}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </section>
  );
}
