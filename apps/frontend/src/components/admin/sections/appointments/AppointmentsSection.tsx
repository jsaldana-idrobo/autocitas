import React from "react";
import { AppointmentItem, ResourceItem, ServiceItem } from "../../types";
import { Badge } from "../../ui/Badge";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "../../ui/DataTable";
import { SectionHeader } from "../../ui/SectionHeader";

export function AppointmentsSection({
  appointments,
  services,
  resources,
  appointmentsDate,
  setAppointmentsDate,
  appointmentsStatus,
  setAppointmentsStatus,
  appointmentsSearch,
  setAppointmentsSearch,
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
  appointmentsSearch: string;
  setAppointmentsSearch: (value: string) => void;
  loadAppointments: () => void;
  updateAppointmentStatus: (appointmentId: string, status: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <SectionHeader
        title="Citas"
        subtitle="Administra las citas del negocio."
        actions={
          <button
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            onClick={loadAppointments}
          >
            Refrescar
          </button>
        }
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="date"
          value={appointmentsDate}
          onChange={(event) => setAppointmentsDate(event.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={appointmentsStatus}
          onChange={(event) => setAppointmentsStatus(event.target.value)}
        >
          <option value="">Todos</option>
          <option value="booked">Reservadas</option>
          <option value="completed">Completadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Buscar por nombre o telefono"
          value={appointmentsSearch}
          onChange={(event) => setAppointmentsSearch(event.target.value)}
        />
        <button
          className="rounded-xl bg-primary-600 px-4 py-2 text-sm text-white"
          onClick={loadAppointments}
        >
          Buscar
        </button>
      </div>

      <div className="mt-4">
        <DataTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Cliente</TableHeaderCell>
              <TableHeaderCell>Servicio</TableHeaderCell>
              <TableHeaderCell>Horario</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.map((item) => {
              const serviceName = services.find((service) => service._id === item.serviceId)?.name;
              const resourceName = resources.find(
                (resource) => resource._id === item.resourceId
              )?.name;
              return (
                <TableRow key={item._id}>
                  <TableCell>
                    <div className="font-medium">{item.customerName}</div>
                    <div className="text-xs text-slate-500">{item.customerPhone}</div>
                  </TableCell>
                  <TableCell>
                    <div>{serviceName ?? "-"}</div>
                    <div className="text-xs text-slate-500">{resourceName ?? "-"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{new Date(item.startTime).toLocaleString()}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(item.endTime).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      tone={
                        item.status === "booked"
                          ? "warning"
                          : item.status === "completed"
                            ? "success"
                            : "danger"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                        onClick={() => updateAppointmentStatus(item._id, "completed")}
                      >
                        Completar
                      </button>
                      <button
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                        onClick={() => updateAppointmentStatus(item._id, "cancelled")}
                      >
                        Cancelar
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {appointments.length === 0 && (
              <TableRow>
                <TableCell className="text-slate-500" colSpan={5}>
                  No hay citas para los filtros actuales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </DataTable>
      </div>
    </section>
  );
}
