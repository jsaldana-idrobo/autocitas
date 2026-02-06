import React from "react";
import { BlockItem, BusinessProfile, ResourceItem } from "../../types";
import { BlockEditor } from "../../components/BlockEditor";
import { InputField } from "../../components/InputField";
import { Modal } from "../../ui/Modal";
import { BusinessSearchSelect } from "../../components/BusinessSearchSelect";

type PlatformBlocksModalsProps = {
  businesses: BusinessProfile[];
  businessLookup: Map<string, string>;
  resources: ResourceItem[];
  createOpen: boolean;
  setCreateOpen: (value: boolean) => void;
  createBusinessId: string;
  setCreateBusinessId: (value: string) => void;
  createResourceId: string;
  setCreateResourceId: (value: string) => void;
  createResourcesLoading: boolean;
  filteredResources: ResourceItem[];
  editingBlock: BlockItem | null;
  setEditingBlock: (value: BlockItem | null) => void;
  viewingBlock: BlockItem | null;
  setViewingBlock: (value: BlockItem | null) => void;
  deletingBlock: BlockItem | null;
  setDeletingBlock: (value: BlockItem | null) => void;
  authHeaders: { token: string };
  onCreate: (businessId: string, payload: Partial<BlockItem>) => void;
  onUpdate: (businessId: string, blockId: string, payload: Partial<BlockItem>) => void;
  onDelete: (businessId: string, blockId: string) => void;
};

export function PlatformBlocksModals({
  businesses,
  businessLookup,
  resources,
  createOpen,
  setCreateOpen,
  createBusinessId,
  setCreateBusinessId,
  createResourceId,
  setCreateResourceId,
  createResourcesLoading,
  filteredResources,
  editingBlock,
  setEditingBlock,
  viewingBlock,
  setViewingBlock,
  deletingBlock,
  setDeletingBlock,
  authHeaders,
  onCreate,
  onUpdate,
  onDelete
}: PlatformBlocksModalsProps) {
  return (
    <>
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
    </>
  );
}
