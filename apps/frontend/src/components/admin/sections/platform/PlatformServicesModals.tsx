import React from "react";
import { BusinessProfile, ResourceItem, ServiceItem } from "../../types";
import { ServiceEditor } from "../../components/ServiceEditor";
import { InputField } from "../../components/InputField";
import { Modal } from "../../ui/Modal";
import { BusinessSearchSelect } from "../../components/BusinessSearchSelect";
import { ConfirmDeleteModal } from "../../ui/ConfirmDeleteModal";

type PlatformServicesModalsProps = {
  businesses: BusinessProfile[];
  businessLookup: Map<string, string>;
  resources: ResourceItem[];
  createOpen: boolean;
  setCreateOpen: (value: boolean) => void;
  createBusinessId: string;
  setCreateBusinessId: (value: string) => void;
  editingService: ServiceItem | null;
  setEditingService: (value: ServiceItem | null) => void;
  viewingService: ServiceItem | null;
  setViewingService: (value: ServiceItem | null) => void;
  deletingService: ServiceItem | null;
  setDeletingService: (value: ServiceItem | null) => void;
  authHeaders: { token: string };
  onCreate: (
    businessId: string,
    payload: { name: string; durationMinutes: number; price?: number }
  ) => void;
  onUpdate: (businessId: string, serviceId: string, payload: Partial<ServiceItem>) => void;
  onDelete: (businessId: string, serviceId: string) => void;
};

export function PlatformServicesModals({
  businesses,
  businessLookup,
  resources,
  createOpen,
  setCreateOpen,
  createBusinessId,
  setCreateBusinessId,
  editingService,
  setEditingService,
  viewingService,
  setViewingService,
  deletingService,
  setDeletingService,
  authHeaders,
  onCreate,
  onUpdate,
  onDelete
}: PlatformServicesModalsProps) {
  const getResourcesForService = (service: ServiceItem) => {
    if (!service.businessId) return [];
    return resources.filter((resource) => resource.businessId === service.businessId);
  };

  return (
    <>
      <Modal open={createOpen} title="Nuevo servicio" onClose={() => setCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const readString = (key: string) => {
              const value = form.get(key);
              return typeof value === "string" ? value.trim() : "";
            };
            const name = readString("name");
            const durationMinutes = Number(readString("durationMinutes"));
            const priceRaw = readString("price");
            const price = priceRaw ? Number(priceRaw) : undefined;
            if (!createBusinessId || !name || !durationMinutes) {
              return;
            }
            onCreate(createBusinessId, { name, durationMinutes, price });
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
          <InputField name="name" label="Nombre" placeholder="Corte clasico" />
          <InputField name="durationMinutes" label="Duracion (min)" type="number" />
          <InputField name="price" label="Precio" type="number" />
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
        open={Boolean(editingService)}
        title="Editar servicio"
        onClose={() => setEditingService(null)}
      >
        {editingService && (
          <ServiceEditor
            item={editingService}
            resources={getResourcesForService(editingService)}
            onCancel={() => setEditingService(null)}
            onSave={(payload) => {
              if (!editingService.businessId) return;
              onUpdate(editingService.businessId, editingService._id, payload);
              setEditingService(null);
            }}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(viewingService)}
        title="Detalle del servicio"
        onClose={() => setViewingService(null)}
      >
        {viewingService && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="text-sm md:col-span-2">
              <div className="text-xs uppercase tracking-wide text-slate-400">Negocio</div>
              <div className="font-medium">
                {viewingService.businessId
                  ? businessLookup.get(viewingService.businessId) || viewingService.businessId
                  : "-"}
              </div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Nombre</div>
              <div className="font-medium">{viewingService.name}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Duracion</div>
              <div className="font-medium">{viewingService.durationMinutes} min</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Precio</div>
              <div className="font-medium">${viewingService.price ?? "-"}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Estado</div>
              <div className="font-medium">{viewingService.active ? "Activo" : "Inactivo"}</div>
            </div>
          </div>
        )}
      </Modal>

      {deletingService && (
        <ConfirmDeleteModal
          open={Boolean(deletingService)}
          title="Eliminar servicio"
          description="Esta accion no se puede deshacer."
          itemLabel={deletingService.name}
          onClose={() => setDeletingService(null)}
          onConfirm={() => {
            if (!deletingService.businessId) return;
            onDelete(deletingService.businessId, deletingService._id);
            setDeletingService(null);
          }}
        />
      )}
    </>
  );
}
