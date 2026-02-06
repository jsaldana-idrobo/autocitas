import React from "react";
import { ResourceItem, StaffItem } from "../../types";
import { StaffEditor } from "../../components/StaffEditor";
import { Modal } from "../../ui/Modal";

type StaffModalsProps = Readonly<{
  createOpen: boolean;
  setCreateOpen: (value: boolean) => void;
  editingStaff: StaffItem | null;
  setEditingStaff: (value: StaffItem | null) => void;
  viewingStaff: StaffItem | null;
  setViewingStaff: (value: StaffItem | null) => void;
  deletingStaff: StaffItem | null;
  setDeletingStaff: (value: StaffItem | null) => void;
  resources: ResourceItem[];
  createStaff: (event: React.FormEvent<HTMLFormElement>) => void;
  updateStaff: (
    staffId: string,
    payload: { resourceId?: string; password?: string; active?: boolean }
  ) => void;
  deleteStaff: (staffId: string) => void;
}>;

export function StaffModals({
  createOpen,
  setCreateOpen,
  editingStaff,
  setEditingStaff,
  viewingStaff,
  setViewingStaff,
  deletingStaff,
  setDeletingStaff,
  resources,
  createStaff,
  updateStaff,
  deleteStaff
}: StaffModalsProps) {
  return (
    <>
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
    </>
  );
}
