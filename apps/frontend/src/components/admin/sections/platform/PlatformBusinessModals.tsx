import React from "react";
import { BusinessProfile } from "../../types";
import { InputField } from "../../components/InputField";
import { Modal } from "../../ui/Modal";
import { PlatformEditBusinessForm } from "./PlatformEditBusinessForm";

type PlatformBusinessModalsProps = {
  createOpen: boolean;
  setCreateOpen: (value: boolean) => void;
  editingBusiness: BusinessProfile | null;
  setEditingBusiness: (value: BusinessProfile | null) => void;
  viewingBusiness: BusinessProfile | null;
  setViewingBusiness: (value: BusinessProfile | null) => void;
  deletingBusiness: BusinessProfile | null;
  setDeletingBusiness: (value: BusinessProfile | null) => void;
  onCreate: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdate: (businessId: string, payload: Partial<BusinessProfile>) => void;
  onDelete: (businessId: string) => void;
};

export function PlatformBusinessModals({
  createOpen,
  setCreateOpen,
  editingBusiness,
  setEditingBusiness,
  viewingBusiness,
  setViewingBusiness,
  deletingBusiness,
  setDeletingBusiness,
  onCreate,
  onUpdate,
  onDelete
}: PlatformBusinessModalsProps) {
  return (
    <>
      <Modal
        open={createOpen}
        title="Nuevo negocio"
        description="Completa los datos del negocio."
        onClose={() => setCreateOpen(false)}
      >
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            onCreate(event);
            setCreateOpen(false);
          }}
        >
          <InputField name="name" label="Nombre" />
          <InputField name="slug" label="Slug" />
          <InputField name="timezone" label="Zona horaria" />
          <InputField name="contactPhone" label="Telefono" />
          <InputField name="address" label="Direccion" />
          <label className="block text-sm font-medium">
            <span>Estado</span>
            <select
              name="status"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </label>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
              type="button"
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
        open={Boolean(editingBusiness)}
        title="Editar negocio"
        onClose={() => setEditingBusiness(null)}
      >
        {editingBusiness && (
          <PlatformEditBusinessForm
            business={editingBusiness}
            onCancel={() => setEditingBusiness(null)}
            onSave={(payload) => {
              if (!editingBusiness._id) return;
              onUpdate(editingBusiness._id, payload);
              setEditingBusiness(null);
            }}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(viewingBusiness)}
        title="Detalle del negocio"
        onClose={() => setViewingBusiness(null)}
      >
        {viewingBusiness && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Nombre</div>
              <div className="font-medium">{viewingBusiness.name || "-"}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Slug</div>
              <div className="font-medium">{viewingBusiness.slug || "-"}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Zona horaria</div>
              <div className="font-medium">{viewingBusiness.timezone || "America/Bogota"}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Telefono</div>
              <div className="font-medium">{viewingBusiness.contactPhone || "-"}</div>
            </div>
            <div className="text-sm md:col-span-2">
              <div className="text-xs uppercase tracking-wide text-slate-400">Direccion</div>
              <div className="font-medium">{viewingBusiness.address || "-"}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Estado</div>
              <div className="font-medium">
                {viewingBusiness.status === "active" ? "Activo" : "Inactivo"}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                type="button"
                onClick={() => setViewingBusiness(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deletingBusiness)}
        title="Eliminar negocio"
        description="Esta accion no se puede deshacer."
        onClose={() => setDeletingBusiness(null)}
      >
        {deletingBusiness && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Vas a eliminar <strong>{deletingBusiness.name || "este negocio"}</strong>.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                type="button"
                onClick={() => setDeletingBusiness(null)}
              >
                Cancelar
              </button>
              <button
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm text-white"
                type="button"
                onClick={() => {
                  if (deletingBusiness._id) {
                    onDelete(deletingBusiness._id);
                  }
                  setDeletingBusiness(null);
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
