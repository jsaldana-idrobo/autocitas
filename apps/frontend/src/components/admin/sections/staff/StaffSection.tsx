import React, { useMemo, useState } from "react";
import { ResourceItem, StaffItem } from "../../types";
import { StaffEditor } from "../../components/StaffEditor";
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

export function StaffSection({
  staff,
  resources,
  createStaff,
  updateStaff,
  deleteStaff,
  loadStaff,
  loadResources
}: {
  staff: StaffItem[];
  resources: ResourceItem[];
  createStaff: (event: React.FormEvent<HTMLFormElement>) => void;
  updateStaff: (
    staffId: string,
    payload: { resourceId?: string; password?: string; active?: boolean }
  ) => void;
  deleteStaff: (staffId: string) => void;
  loadStaff: () => void;
  loadResources: () => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffItem | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return staff.filter((member) => {
      const matchesSearch = !term || member.email.toLowerCase().includes(term);
      const matchesStatus =
        !statusFilter || (statusFilter === "active" ? member.active : !member.active);
      return matchesSearch && matchesStatus;
    });
  }, [staff, search, statusFilter]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <SectionHeader
        title="Staff"
        subtitle="Usuarios con acceso operativo."
        actions={
          <>
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onClick={loadStaff}
            >
              Refrescar
            </button>
            <button
              className="rounded-xl bg-primary-600 px-3 py-2 text-sm text-white"
              onClick={() => {
                loadResources();
                setCreateOpen(true);
              }}
            >
              Nuevo staff
            </button>
          </>
        }
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Buscar por email"
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
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Recurso</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((member) => (
              <TableRow key={member._id}>
                <TableCell>
                  <div className="font-medium">{member.email}</div>
                </TableCell>
                <TableCell>{member.resourceId ?? "-"}</TableCell>
                <TableCell>
                  <Badge tone={member.active ? "success" : "warning"}>
                    {member.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => {
                        loadResources();
                        setEditingStaff(member);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                      onClick={() => deleteStaff(member._id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell className="text-slate-500" colSpan={4}>
                  No hay staff para los filtros actuales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </DataTable>
      </div>

      <Modal open={createOpen} title="Nuevo staff" onClose={() => setCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            createStaff(event);
            setCreateOpen(false);
          }}
        >
          <label className="block text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              name="password"
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium md:col-span-2">
            Recurso
            <select
              name="resourceId"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            >
              <option value="">Selecciona recurso</option>
              {resources.map((resource) => (
                <option key={resource._id} value={resource._id}>
                  {resource.name}
                </option>
              ))}
            </select>
          </label>
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
        open={Boolean(editingStaff)}
        title="Editar staff"
        onClose={() => setEditingStaff(null)}
      >
        {editingStaff && (
          <StaffEditor
            item={editingStaff}
            resources={resources}
            onCancel={() => setEditingStaff(null)}
            onSave={(payload) => {
              updateStaff(editingStaff._id, payload);
              setEditingStaff(null);
            }}
          />
        )}
      </Modal>
    </section>
  );
}
