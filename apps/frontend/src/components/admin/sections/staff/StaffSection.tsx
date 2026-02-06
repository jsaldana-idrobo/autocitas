import React, { useEffect, useState } from "react";
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
import { Pagination } from "../../ui/Pagination";
import { SectionHeader } from "../../ui/SectionHeader";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

export function StaffSection({
  staff,
  resources,
  createStaff,
  updateStaff,
  deleteStaff,
  loadStaff,
  loadResources,
  total
}: Readonly<{
  staff: StaffItem[];
  resources: ResourceItem[];
  createStaff: (event: React.FormEvent<HTMLFormElement>) => void;
  updateStaff: (
    staffId: string,
    payload: { resourceId?: string; password?: string; active?: boolean }
  ) => void;
  deleteStaff: (staffId: string) => void;
  loadStaff: (page?: number, limit?: number, search?: string, status?: string) => void;
  loadResources: () => void;
  total: number;
}>) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffItem | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffItem | null>(null);
  const [viewingStaff, setViewingStaff] = useState<StaffItem | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    loadStaff(page, pageSize, debouncedSearch, statusFilter);
  }, [page, pageSize, debouncedSearch, statusFilter, loadStaff]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <SectionHeader
        title="Staff"
        subtitle="Usuarios con acceso operativo."
        actions={
          <>
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onClick={() => loadStaff(page, pageSize, search, statusFilter)}
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
            {staff.map((member) => (
              <TableRow key={member._id}>
                <TableCell>
                  <div className="font-medium">{member.email}</div>
                </TableCell>
                <TableCell>
                  {resources.find((resource) => resource._id === member.resourceId)?.name ||
                    member.resourceId ||
                    "-"}
                </TableCell>
                <TableCell>
                  <Badge tone={member.active ? "success" : "warning"}>
                    {member.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => setViewingStaff(member)}
                    >
                      Ver
                    </button>
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
                      onClick={() => setDeletingStaff(member)}
                    >
                      Eliminar
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {staff.length === 0 && (
              <TableRow>
                <TableCell className="text-slate-500" colSpan={4}>
                  No hay staff para los filtros actuales.
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

      <Modal open={createOpen} title="Nuevo staff" onClose={() => setCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            createStaff(event);
            setCreateOpen(false);
          }}
        >
          <label className="block text-sm font-medium">
            <span>Email</span>
            <input
              name="email"
              type="email"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium">
            <span>Password</span>
            <input
              name="password"
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium md:col-span-2">
            <span>Recurso</span>
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

      <Modal
        open={Boolean(viewingStaff)}
        title="Detalle del staff"
        onClose={() => setViewingStaff(null)}
      >
        {viewingStaff && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Email</div>
              <div className="font-medium">{viewingStaff.email}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Rol</div>
              <div className="font-medium">{viewingStaff.role}</div>
            </div>
            <div className="text-sm md:col-span-2">
              <div className="text-xs uppercase tracking-wide text-slate-400">Recurso</div>
              <div className="font-medium">
                {resources.find((resource) => resource._id === viewingStaff.resourceId)?.name ||
                  viewingStaff.resourceId ||
                  "-"}
              </div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Estado</div>
              <div className="font-medium">{viewingStaff.active ? "Activo" : "Inactivo"}</div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                type="button"
                onClick={() => setViewingStaff(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deletingStaff)}
        title="Eliminar staff"
        description="Esta accion no se puede deshacer."
        onClose={() => setDeletingStaff(null)}
      >
        {deletingStaff && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Vas a eliminar <strong>{deletingStaff.email}</strong>.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                type="button"
                onClick={() => setDeletingStaff(null)}
              >
                Cancelar
              </button>
              <button
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm text-white"
                type="button"
                onClick={() => {
                  deleteStaff(deletingStaff._id);
                  setDeletingStaff(null);
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
