import React, { useState } from "react";
import { ResourceItem, ServiceItem } from "../../../types";

export function CalendarModal({
  title,
  services,
  resources,
  canSelectResource,
  fixedResourceId,
  onSubmit,
  onClose
}: Readonly<{
  title: string;
  services: ServiceItem[];
  resources: ResourceItem[];
  canSelectResource: boolean;
  fixedResourceId?: string;
  onSubmit: (payload: {
    serviceId: string;
    resourceId?: string;
    customerName: string;
    customerPhone: string;
    startTime: string;
  }) => void;
  onClose: () => void;
}>) {
  const [serviceId, setServiceId] = useState(services[0]?._id || "");
  const [resourceId, setResourceId] = useState(fixedResourceId || resources[0]?._id || "");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [startTime, setStartTime] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6">
        <h4 className="text-lg font-semibold">{title}</h4>
        <div className="mt-4 grid gap-3">
          <select
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
          >
            {services.map((service) => (
              <option key={service._id} value={service._id}>
                {service.name}
              </option>
            ))}
          </select>
          {canSelectResource ? (
            <select
              className="rounded-xl border border-slate-200 px-3 py-2"
              value={resourceId}
              onChange={(event) => setResourceId(event.target.value)}
            >
              <option value="">Selecciona recurso</option>
              {resources.map((resource) => (
                <option key={resource._id} value={resource._id}>
                  {resource.name}
                </option>
              ))}
            </select>
          ) : null}
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            placeholder="Nombre"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
          />
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            placeholder="Telefono"
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
          />
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            type="datetime-local"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded-xl border border-slate-200 px-3 py-1 text-sm"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="rounded-xl bg-primary-600 px-3 py-1 text-sm text-white"
            onClick={() => {
              const trimmedName = customerName.trim();
              const trimmedPhone = customerPhone.trim();
              if (!serviceId || !trimmedName || !trimmedPhone || !startTime) {
                setError("Completa servicio, nombre, telefono y hora.");
                return;
              }
              setError("");
              onSubmit({
                serviceId,
                resourceId: canSelectResource ? resourceId || undefined : fixedResourceId,
                customerName: trimmedName,
                customerPhone: trimmedPhone,
                startTime
              });
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
