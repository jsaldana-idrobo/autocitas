import React from "react";
import { BusinessProfile, ResourceItem } from "../../types";
import { ResourceEditor } from "../../components/ResourceEditor";
import { InputField } from "../../components/InputField";
import { Modal } from "../../ui/Modal";
import { BusinessSearchSelect } from "../../components/BusinessSearchSelect";

type PlatformResourcesModalsProps = {
  businesses: BusinessProfile[];
  businessLookup: Map<string, string>;
  createOpen: boolean;
  setCreateOpen: (value: boolean) => void;
  createBusinessId: string;
  setCreateBusinessId: (value: string) => void;
  editingResource: ResourceItem | null;
  setEditingResource: (value: ResourceItem | null) => void;
  viewingResource: ResourceItem | null;
  setViewingResource: (value: ResourceItem | null) => void;
  deletingResource: ResourceItem | null;
  setDeletingResource: (value: ResourceItem | null) => void;
  authHeaders: { token: string };
  onCreate: (businessId: string, payload: { name: string }) => void;
  onUpdate: (businessId: string, resourceId: string, payload: Partial<ResourceItem>) => void;
  onDelete: (businessId: string, resourceId: string) => void;
};

export function PlatformResourcesModals({
  businesses,
  businessLookup,
  createOpen,
  setCreateOpen,
  createBusinessId,
  setCreateBusinessId,
  editingResource,
  setEditingResource,
  viewingResource,
  setViewingResource,
  deletingResource,
  setDeletingResource,
  authHeaders,
  onCreate,
  onUpdate,
  onDelete
}: PlatformResourcesModalsProps) {
  return (
    <>
      <Modal open={createOpen} title="Nuevo recurso" onClose={() => setCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const nameValue = form.get("name");
            const name = typeof nameValue === "string" ? nameValue.trim() : "";
            if (!createBusinessId || !name) {
              return;
            }
            onCreate(createBusinessId, { name });
            event.currentTarget.reset();
            setCreateBusinessId("");
            setCreateOpen(false);
          }}
        >
          <BusinessSearchSelect
            className="md:col-span-2"
            value={createBusinessId}
            onChange={setCreateBusinessId}
            authHeaders={authHeaders}
            initialOptions={businesses}
            selectedLabel={businessLookup.get(createBusinessId)}
            required
          />
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
              disabled={!createBusinessId}
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
              if (!editingResource.businessId) return;
              onUpdate(editingResource.businessId, editingResource._id, payload);
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
            <div className="text-sm md:col-span-2">
              <div className="text-xs uppercase tracking-wide text-slate-400">Negocio</div>
              <div className="font-medium">
                {viewingResource.businessId
                  ? businessLookup.get(viewingResource.businessId) || viewingResource.businessId
                  : "-"}
              </div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Nombre</div>
              <div className="font-medium">{viewingResource.name}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Estado</div>
              <div className="font-medium">{viewingResource.active ? "Activo" : "Inactivo"}</div>
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
                  if (!deletingResource.businessId) return;
                  onDelete(deletingResource.businessId, deletingResource._id);
                  setDeletingResource(null);
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
