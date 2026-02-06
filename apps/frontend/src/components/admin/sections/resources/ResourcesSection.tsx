import React, { useEffect, useState } from "react";
import { ResourceItem } from "../../types";
import { ResourceEditor } from "../../components/ResourceEditor";
import { InputField } from "../../components/InputField";
import { Badge } from "../../ui/Badge";
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

export function ResourcesSection({
  resources,
  createResource,
  updateResource,
  deleteResource,
  loadResources,
  total
}: Readonly<{
  resources: ResourceItem[];
  createResource: (event: React.FormEvent<HTMLFormElement>) => void;
  updateResource: (resourceId: string, payload: Partial<ResourceItem>) => void;
  deleteResource: (resourceId: string) => void;
  loadResources: (page?: number, limit?: number, search?: string, status?: string) => void;
  total: number;
}>) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [deletingResource, setDeletingResource] = useState<ResourceItem | null>(null);
  const [viewingResource, setViewingResource] = useState<ResourceItem | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    loadResources(page, pageSize, debouncedSearch, statusFilter);
  }, [page, pageSize, debouncedSearch, statusFilter, loadResources]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <SectionHeader
        title="Recursos"
        subtitle="Gestiona los recursos disponibles."
        actions={
          <>
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onClick={() => loadResources(page, pageSize, search, statusFilter)}
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

      <div className="mt-4">
        <DataTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Recurso</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {resources.map((resource) => (
              <TableRow key={resource._id}>
                <TableCell>
                  <div className="font-medium">{resource.name}</div>
                </TableCell>
                <TableCell>
                  <Badge tone={resource.active ? "success" : "warning"}>
                    {resource.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => setViewingResource(resource)}
                    >
                      Ver
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => setEditingResource(resource)}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => updateResource(resource._id, { active: !resource.active })}
                    >
                      {resource.active ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                      onClick={() => setDeletingResource(resource)}
                    >
                      Eliminar
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {resources.length === 0 && (
              <TableRow>
                <TableCell className="text-slate-500" colSpan={3}>
                  No hay recursos para los filtros actuales.
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

      <Modal open={createOpen} title="Nuevo recurso" onClose={() => setCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            createResource(event);
            setCreateOpen(false);
          }}
        >
          <InputField name="name" label="Nombre" />
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
            >
              Crear
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(editingResource)}
        title="Editar recurso"
        onClose={() => setEditingResource(null)}
      >
        {editingResource && (
          <ResourceEditor
            item={editingResource}
            onCancel={() => setEditingResource(null)}
            onSave={(payload) => {
              updateResource(editingResource._id, payload);
              setEditingResource(null);
            }}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(viewingResource)}
        title="Detalle del recurso"
        onClose={() => setViewingResource(null)}
      >
        {viewingResource && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Nombre</div>
              <div className="font-medium">{viewingResource.name}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Estado</div>
              <div className="font-medium">{viewingResource.active ? "Activo" : "Inactivo"}</div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                type="button"
                onClick={() => setViewingResource(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deletingResource)}
        title="Eliminar recurso"
        description="Esta accion no se puede deshacer."
        onClose={() => setDeletingResource(null)}
      >
        {deletingResource && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Vas a eliminar <strong>{deletingResource.name}</strong>.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                type="button"
                onClick={() => setDeletingResource(null)}
              >
                Cancelar
              </button>
              <button
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm text-white"
                type="button"
                onClick={() => {
                  deleteResource(deletingResource._id);
                  setDeletingResource(null);
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
