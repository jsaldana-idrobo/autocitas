import React from "react";
import { AppointmentItem, ResourceItem, ServiceItem } from "../types";

export function AppointmentsSection({
  appointments,
  services,
  resources,
  appointmentsDate,
  setAppointmentsDate,
  appointmentsStatus,
  setAppointmentsStatus,
  loadAppointments,
  updateAppointmentStatus
}: {
  appointments: AppointmentItem[];
  services: ServiceItem[];
  resources: ResourceItem[];
  appointmentsDate: string;
  setAppointmentsDate: (value: string) => void;
  appointmentsStatus: string;
  setAppointmentsStatus: (value: string) => void;
  loadAppointments: () => void;
  updateAppointmentStatus: (appointmentId: string, status: string) => void;
}) {
  return (
    <section className="card p-6">
      <h3 className="text-lg font-semibold">Citas</h3>
      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="date"
          value={appointmentsDate}
          onChange={(event) => setAppointmentsDate(event.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2"
        />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2"
          value={appointmentsStatus}
          onChange={(event) => setAppointmentsStatus(event.target.value)}
        >
          <option value="">Todos</option>
          <option value="booked">Reservadas</option>
          <option value="completed">Completadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
        <button
          className="rounded-xl bg-primary-600 px-4 py-2 text-white"
          onClick={() => void loadAppointments()}
        >
          Buscar
        </button>
      </div>
      <div className="mt-6 space-y-2">
        {appointments.map((item) => {
          const serviceName = services.find((service) => service._id === item.serviceId)?.name;
          const resourceName = resources.find((resource) => resource._id === item.resourceId)?.name;
          return (
            <div key={item._id} className="card-muted p-3">
              <p className="font-medium">{item.customerName}</p>
              <p className="text-xs text-slate-500">
                {new Date(item.startTime).toLocaleString()} -{" "}
                {new Date(item.endTime).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                {item.customerPhone} · {item.status}
                {serviceName ? ` · ${serviceName}` : ""}
                {resourceName ? ` · ${resourceName}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                  onClick={() => updateAppointmentStatus(item._id, "completed")}
                >
                  Marcar completada
                </button>
                <button
                  className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                  onClick={() => updateAppointmentStatus(item._id, "cancelled")}
                >
                  Cancelar
                </button>
              </div>
            </div>
          );
        })}
        {appointments.length === 0 && (
          <p className="text-sm text-slate-500">No hay citas para los filtros actuales.</p>
        )}
      </div>
    </section>
  );
}
