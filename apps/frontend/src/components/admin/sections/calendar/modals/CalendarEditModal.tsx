import React, { useState } from "react";
import { AppointmentItem, ResourceItem, ServiceItem } from "../../../types";
import { toLocalInputValue } from "../../../utils";
import { statusLabels } from "../constants";

export function CalendarEditModal({
  appointment,
  services,
  resources,
  canSelectResource,
  fixedResourceId,
  onSubmit,
  onCancel,
  onClose
}: Readonly<{
  appointment: AppointmentItem;
  services: ServiceItem[];
  resources: ResourceItem[];
  canSelectResource: boolean;
  fixedResourceId?: string;
  onSubmit: (payload: { serviceId?: string; resourceId?: string; startTime?: string }) => void;
  onCancel: () => void;
  onClose: () => void;
}>) {
  const [serviceId, setServiceId] = useState(appointment.serviceId);
  const [resourceId, setResourceId] = useState(fixedResourceId ?? appointment.resourceId ?? "");
  const [startTime, setStartTime] = useState(toLocalInputValue(appointment.startTime));
  const [error, setError] = useState("");
  const serviceName =
    services.find((service) => service._id === appointment.serviceId)?.name ?? "Servicio";
  const statusLabel = statusLabels[appointment.status] || appointment.status;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <button
        type="button"
        aria-label="Cerrar modal"
        className="fixed inset-0 z-0 cursor-pointer"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6">
        <h4 className="text-lg font-semibold">Editar cita</h4>
        <div className="mt-4 grid gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
            <div className="font-semibold text-slate-800">{appointment.customerName}</div>
            <div>{appointment.customerPhone}</div>
            <div>{serviceName}</div>
            <div className="mt-1">Estado: {statusLabel}</div>
          </div>
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
            type="datetime-local"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex justify-between gap-2">
          <button
            className="rounded-xl border border-slate-200 px-3 py-1 text-sm"
            onClick={onCancel}
          >
            Cancelar cita
          </button>
          <div className="flex gap-2">
            <button
              className="rounded-xl border border-slate-200 px-3 py-1 text-sm"
              onClick={onClose}
            >
              Cerrar
            </button>
            <button
              className="rounded-xl bg-primary-600 px-3 py-1 text-sm text-white"
              onClick={() => {
                if (!serviceId || !startTime) {
                  setError("Completa servicio y hora.");
                  return;
                }
                setError("");
                onSubmit({
                  serviceId,
                  resourceId: canSelectResource ? resourceId || undefined : fixedResourceId,
                  startTime
                });
              }}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
