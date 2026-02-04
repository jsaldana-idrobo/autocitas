import React from "react";
import { ResourceItem, ServiceItem } from "../types";
import { InputField } from "../components/InputField";
import { ServiceEditor } from "../components/ServiceEditor";

export function ServicesSection({
  services,
  resources,
  editingServiceId,
  setEditingServiceId,
  createService,
  updateService,
  loadServices,
  ensureResourcesLoaded
}: {
  services: ServiceItem[];
  resources: ResourceItem[];
  editingServiceId: string | null;
  setEditingServiceId: (value: string | null) => void;
  createService: (event: React.FormEvent<HTMLFormElement>) => void;
  updateService: (serviceId: string, payload: Partial<ServiceItem>) => void;
  loadServices: () => void;
  ensureResourcesLoaded: () => void;
}) {
  return (
    <section className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Servicios</h3>
        <button className="text-xs text-slate-500" onClick={() => void loadServices()}>
          Refrescar
        </button>
      </div>
      <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={createService}>
        <InputField name="name" label="Nombre" placeholder="Corte clasico" />
        <InputField name="durationMinutes" label="Duracion (min)" type="number" />
        <InputField name="price" label="Precio" type="number" />
        <button
          className="rounded-xl bg-primary-600 px-4 py-2 text-white md:col-span-3"
          type="submit"
        >
          Crear servicio
        </button>
      </form>
      <div className="mt-6 space-y-2">
        {services.map((service) => (
          <div key={service._id} className="card-muted p-3">
            {editingServiceId === service._id ? (
              <ServiceEditor
                item={service}
                resources={resources}
                onCancel={() => setEditingServiceId(null)}
                onSave={(payload) => updateService(service._id, payload)}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-xs text-slate-500">
                    {service.durationMinutes} min · {service.active ? "Activo" : "Inactivo"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">${service.price ?? "-"}</span>
                  <button
                    className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                    onClick={() => {
                      void ensureResourcesLoaded();
                      setEditingServiceId(service._id);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                    onClick={() => updateService(service._id, { active: !service.active })}
                  >
                    {service.active ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {services.length === 0 && (
          <p className="text-sm text-slate-500">No hay servicios creados.</p>
        )}
      </div>
    </section>
  );
}
