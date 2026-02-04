import React, { useMemo, useState } from "react";
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
import { SectionHeader } from "../../ui/SectionHeader";

export function ResourcesSection({
  resources,
  createResource,
  updateResource,
  deleteResource,
  loadResources
}: {
  resources: ResourceItem[];
  createResource: (event: React.FormEvent<HTMLFormElement>) => void;
  updateResource: (resourceId: string, payload: Partial<ResourceItem>) => void;
  deleteResource: (resourceId: string) => void;
  loadResources: () => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesSearch = !term || resource.name.toLowerCase().includes(term);
      const matchesStatus =
        !statusFilter || (statusFilter === "active" ? resource.active : !resource.active);
      return matchesSearch && matchesStatus;
    });
  }, [resources, search, statusFilter]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <SectionHeader
        title="Recursos"
        subtitle="Gestiona los recursos disponibles."
        actions={
          <>
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onClick={loadResources}
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
            {filtered.map((resource) => (
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
                      onClick={() => deleteResource(resource._id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell className="text-slate-500" colSpan={3}>
                  No hay recursos para los filtros actuales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </DataTable>
      </div>

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
    </section>
  );
}
