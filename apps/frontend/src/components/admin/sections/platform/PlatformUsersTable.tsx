import React, { useMemo, useState } from "react";
import { PlatformUserUpdate, StaffItem } from "../../types";
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
import { PlatformEditUserForm } from "./PlatformEditUserForm";

export function PlatformUsersTable({
  title,
  users,
  onRefresh,
  onUpdate,
  onDelete,
  actions
}: {
  title: string;
  users: StaffItem[];
  onRefresh: () => void;
  onUpdate: (userId: string, payload: PlatformUserUpdate) => void;
  onDelete: (userId: string) => void;
  actions?: React.ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [editingUser, setEditingUser] = useState<StaffItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<StaffItem | null>(null);
  const [viewingUser, setViewingUser] = useState<StaffItem | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !term || user.email.toLowerCase().includes(term);
      const matchesActive =
        !activeFilter || (activeFilter === "active" ? user.active : !user.active);
      return matchesSearch && matchesActive;
    });
  }, [users, search, activeFilter]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <SectionHeader
        title={title}
        subtitle="Administra usuarios de la plataforma."
        actions={
          <>
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onClick={onRefresh}
            >
              Refrescar
            </button>
            {actions}
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
          value={activeFilter}
          onChange={(event) => setActiveFilter(event.target.value)}
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
              <TableHeaderCell>Business ID</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  <div className="font-medium">{user.email}</div>
                  <div className="text-xs text-slate-500">{user.role}</div>
                </TableCell>
                <TableCell>{user.businessId ?? "-"}</TableCell>
                <TableCell>
                  <Badge tone={user.active ? "success" : "warning"}>
                    {user.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => setViewingUser(user)}
                    >
                      Ver
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => setEditingUser(user)}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                      onClick={() => setDeletingUser(user)}
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
                  No hay usuarios para los filtros actuales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </DataTable>
      </div>

      <Modal
        open={Boolean(editingUser)}
        title="Editar usuario"
        onClose={() => setEditingUser(null)}
      >
        {editingUser && (
          <PlatformEditUserForm
            user={editingUser}
            onCancel={() => setEditingUser(null)}
            onSave={(payload) => {
              onUpdate(editingUser._id, payload);
              setEditingUser(null);
            }}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(viewingUser)}
        title="Detalle del usuario"
        onClose={() => setViewingUser(null)}
      >
        {viewingUser && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Email</div>
              <div className="font-medium">{viewingUser.email}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Rol</div>
              <div className="font-medium">{viewingUser.role}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Business ID</div>
              <div className="font-medium">{viewingUser.businessId ?? "-"}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Recurso ID</div>
              <div className="font-medium">{viewingUser.resourceId ?? "-"}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Estado</div>
              <div className="font-medium">{viewingUser.active ? "Activo" : "Inactivo"}</div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                type="button"
                onClick={() => setViewingUser(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deletingUser)}
        title="Eliminar usuario"
        description="Esta accion no se puede deshacer."
        onClose={() => setDeletingUser(null)}
      >
        {deletingUser && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Vas a eliminar <strong>{deletingUser.email}</strong>.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                type="button"
                onClick={() => setDeletingUser(null)}
              >
                Cancelar
              </button>
              <button
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm text-white"
                type="button"
                onClick={() => {
                  onDelete(deletingUser._id);
                  setDeletingUser(null);
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
