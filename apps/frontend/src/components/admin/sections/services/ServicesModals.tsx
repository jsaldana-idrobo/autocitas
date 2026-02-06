import React from "react";
import { ResourceItem, ServiceItem } from "../../types";
import { InputField } from "../../components/InputField";
import { Modal } from "../../ui/Modal";
import { ServiceEditor } from "../../components/ServiceEditor";

type ServicesModalsProps = {
  createOpen: boolean;
  setCreateOpen: (value: boolean) => void;
  editingService: ServiceItem | null;
  setEditingService: (value: ServiceItem | null) => void;
  viewingService: ServiceItem | null;
  setViewingService: (value: ServiceItem | null) => void;
  deletingService: ServiceItem | null;
  setDeletingService: (value: ServiceItem | null) => void;
  resources: ResourceItem[];
  createService: (event: React.FormEvent<HTMLFormElement>) => void;
  updateService: (serviceId: string, payload: Partial<ServiceItem>) => void;
  deleteService: (serviceId: string) => void;
};

export function ServicesModals({
  createOpen,
  setCreateOpen,
  editingService,
  setEditingService,
  viewingService,
  setViewingService,
  deletingService,
  setDeletingService,
  resources,
  createService,
  updateService,
  deleteService
}: ServicesModalsProps) {
  const viewingPriceLabel = viewingService?.price == null ? "-" : `$${viewingService.price}`;

  return (
    <>
      <Modal open={createOpen} title="Nuevo servicio" onClose={() => setCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            createService(event);
            setCreateOpen(false);
          }}
        >
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
            resources={resources}
            onCancel={() => setEditingService(null)}
            onSave={(payload) => {
              updateService(editingService._id, payload);
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
              <div className="font-medium">{viewingPriceLabel}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Estado</div>
              <div className="font-medium">{viewingService.active ? "Activo" : "Inactivo"}</div>
            </div>
            <div className="text-sm md:col-span-2">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Recursos permitidos
              </div>
              <div className="font-medium">
                {viewingService.allowedResourceIds?.length
                  ? viewingService.allowedResourceIds
                      .map((id) => resources.find((resource) => resource._id === id)?.name || id)
                      .join(", ")
                  : "Todos"}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deletingService)}
        title="Eliminar servicio"
        description="Esta accion no se puede deshacer."
        onClose={() => setDeletingService(null)}
      >
        {deletingService && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Vas a eliminar <strong>{deletingService.name}</strong>.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                type="button"
                onClick={() => setDeletingService(null)}
              >
                Cancelar
              </button>
              <button
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm text-white"
                type="button"
                onClick={() => {
                  deleteService(deletingService._id);
                  setDeletingService(null);
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
