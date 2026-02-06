import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../../../lib/api";
import { BlockItem, BusinessProfile, PaginatedResponse, ResourceItem } from "../../types";
import { BlockEditor } from "../../components/BlockEditor";
import { InputField } from "../../components/InputField";
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
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { BusinessSearchSelect } from "../../components/BusinessSearchSelect";

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
}: Readonly<{
  blocks: BlockItem[];
  resources: ResourceItem[];
  businesses: BusinessProfile[];
  onRefresh: (options?: {
    page?: number;
    limit?: number;
    businessId?: string;
    resourceId?: string;
    search?: string;
    type?: string;
    from?: string;
    to?: string;
  }) => void;
  onCreate: (businessId: string, payload: Partial<BlockItem>) => void;
  onUpdate: (businessId: string, blockId: string, payload: Partial<BlockItem>) => void;
  onDelete: (businessId: string, blockId: string) => void;
  total: number;
  authHeaders: { token: string };
}>) {
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

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Buscar por motivo"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
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
          value={resourceFilter}
          onChange={(event) => setResourceFilter(event.target.value)}
        >
          <option value="">Todos los recursos</option>
          {resources
            .filter((resource) => !businessFilter || resource.businessId === businessFilter)
            .map((resource) => (
              <option key={resource._id} value={resource._id}>
                {resource.name}
              </option>
            ))}
        </select>
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="resource">Con recurso</option>
          <option value="global">Sin recurso</option>
        </select>
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          type="date"
          value={fromFilter}
          onChange={(event) => setFromFilter(event.target.value)}
        />
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          type="date"
          value={toFilter}
          onChange={(event) => setToFilter(event.target.value)}
        />
      </div>

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

      <Modal open={createOpen} title="Nuevo bloqueo" onClose={() => setCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const readString = (key: string) => {
              const value = form.get(key);
              return typeof value === "string" ? value.trim() : "";
            };
            const startTime = readString("startTime");
            const endTime = readString("endTime");
            const reason = readString("reason");
            if (!createBusinessId || !startTime || !endTime) {
              return;
            }
            onCreate(createBusinessId, {
              startTime,
              endTime,
              resourceId: createResourceId || undefined,
              reason: reason || undefined
            });
            event.currentTarget.reset();
            setCreateBusinessId("");
            setCreateResourceId("");
            setCreateOpen(false);
          }}
        >
          <BusinessSearchSelect
            className="md:col-span-2"
            value={createBusinessId}
            onChange={(value) => {
              setCreateBusinessId(value);
              setCreateResourceId("");
            }}
            authHeaders={authHeaders}
            initialOptions={businesses}
            selectedLabel={businessLookup.get(createBusinessId)}
            required
          />
          <InputField name="startTime" label="Inicio" type="datetime-local" />
          <InputField name="endTime" label="Fin" type="datetime-local" />
          <label className="block text-sm font-medium md:col-span-2">
            <span>Recurso</span>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={createResourceId}
              onChange={(event) => setCreateResourceId(event.target.value)}
              disabled={!createBusinessId || createResourcesLoading}
            >
              <option value="">Todos</option>
              {filteredResources.map((resource) => (
                <option key={resource._id} value={resource._id}>
                  {resource.name}
                </option>
              ))}
            </select>
          </label>
          <InputField name="reason" label="Motivo" placeholder="Cita personal" />
          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
              onClick={() => setCreateOpen(false)}
            >
              Cancelar
            </button>
            <button
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm text-white"
              type="submit"
              disabled={!createBusinessId}
            >
              Crear
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(editingBlock)}
        title="Editar bloqueo"
        onClose={() => setEditingBlock(null)}
      >
        {editingBlock && (
          <BlockEditor
            item={editingBlock}
            resources={resources.filter(
              (resource) => resource.businessId === editingBlock.businessId
            )}
            canEditResource
            onCancel={() => setEditingBlock(null)}
            onSave={(payload) => {
              if (!editingBlock.businessId) return;
              onUpdate(editingBlock.businessId, editingBlock._id, payload);
              setEditingBlock(null);
            }}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(viewingBlock)}
        title="Detalle del bloqueo"
        onClose={() => setViewingBlock(null)}
      >
        {viewingBlock && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="text-sm md:col-span-2">
              <div className="text-xs uppercase tracking-wide text-slate-400">Negocio</div>
              <div className="font-medium">
                {viewingBlock.businessId
                  ? businessLookup.get(viewingBlock.businessId) || viewingBlock.businessId
                  : "-"}
              </div>
            </div>
            <div className="text-sm md:col-span-2">
              <div className="text-xs uppercase tracking-wide text-slate-400">Motivo</div>
              <div className="font-medium">{viewingBlock.reason || "Bloqueo"}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Inicio</div>
              <div className="font-medium">{new Date(viewingBlock.startTime).toLocaleString()}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Fin</div>
              <div className="font-medium">{new Date(viewingBlock.endTime).toLocaleString()}</div>
            </div>
            <div className="text-sm md:col-span-2">
              <div className="text-xs uppercase tracking-wide text-slate-400">Recurso</div>
              <div className="font-medium">
                {resources.find((resource) => resource._id === viewingBlock.resourceId)?.name ||
                  viewingBlock.resourceId ||
                  "Todos"}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                type="button"
                onClick={() => setViewingBlock(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deletingBlock)}
        title="Eliminar bloqueo"
        description="Esta accion no se puede deshacer."
        onClose={() => setDeletingBlock(null)}
      >
        {deletingBlock && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Vas a eliminar <strong>{deletingBlock.reason || "este bloqueo"}</strong>.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                type="button"
                onClick={() => setDeletingBlock(null)}
              >
                Cancelar
              </button>
              <button
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm text-white"
                type="button"
                onClick={() => {
                  if (!deletingBlock.businessId) return;
                  onDelete(deletingBlock.businessId, deletingBlock._id);
                  setDeletingBlock(null);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
