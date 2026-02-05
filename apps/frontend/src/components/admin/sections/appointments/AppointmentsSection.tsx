import React, { useEffect, useState } from "react";
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
import { Modal } from "../../ui/Modal";
import { Pagination } from "../../ui/Pagination";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

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
  updateAppointmentStatus,
  total
}: Readonly<{
  appointments: AppointmentItem[];
  services: ServiceItem[];
  resources: ResourceItem[];
  appointmentsDate: string;
  setAppointmentsDate: (value: string) => void;
  appointmentsStatus: string;
  setAppointmentsStatus: (value: string) => void;
  appointmentsSearch: string;
  setAppointmentsSearch: (value: string) => void;
  loadAppointments: (
    date?: string,
    status?: string,
    search?: string,
    page?: number,
    limit?: number
  ) => void;
  updateAppointmentStatus: (appointmentId: string, status: string) => void;
  total: number;
}>) {
  const [viewingAppointment, setViewingAppointment] = useState<AppointmentItem | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const debouncedSearch = useDebouncedValue(appointmentsSearch, 400);

  React.useEffect(() => {
    setPage(1);
  }, [appointments, appointmentsDate, appointmentsStatus, debouncedSearch]);

  useEffect(() => {
    loadAppointments(appointmentsDate, appointmentsStatus, debouncedSearch, page, pageSize);
  }, [appointmentsDate, appointmentsStatus, debouncedSearch, page, pageSize, loadAppointments]);

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
          onClick={() =>
            loadAppointments(appointmentsDate, appointmentsStatus, appointmentsSearch, 1, pageSize)
          }
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
              const statusTone = (() => {
                if (item.status === "booked") return "warning";
                if (item.status === "completed") return "success";
                return "danger";
              })();
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
                    <Badge tone={statusTone}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                        onClick={() => setViewingAppointment(item)}
                      >
                        Ver
                      </button>
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

      <Pagination
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setPage(1);
        }}
      />

      <Modal
        open={Boolean(viewingAppointment)}
        title="Detalle de la cita"
        onClose={() => setViewingAppointment(null)}
      >
        {viewingAppointment && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Cliente</div>
              <div className="font-medium">{viewingAppointment.customerName}</div>
              <div className="text-xs text-slate-500">{viewingAppointment.customerPhone}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Estado</div>
              <div className="font-medium">{viewingAppointment.status}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Servicio</div>
              <div className="font-medium">
                {services.find((service) => service._id === viewingAppointment.serviceId)?.name ||
                  "-"}
              </div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Recurso</div>
              <div className="font-medium">
                {resources.find((resource) => resource._id === viewingAppointment.resourceId)
                  ?.name || "-"}
              </div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Inicio</div>
              <div className="font-medium">
                {new Date(viewingAppointment.startTime).toLocaleString()}
              </div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Fin</div>
              <div className="font-medium">
                {new Date(viewingAppointment.endTime).toLocaleString()}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                type="button"
                onClick={() => setViewingAppointment(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
