import React, { useEffect, useState } from "react";
import { AppointmentItem, ResourceItem, ServiceItem } from "../../types";
import { SectionHeader } from "../../ui/SectionHeader";
import { Modal } from "../../ui/Modal";
import { Pagination } from "../../ui/Pagination";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { AppointmentsList } from "../shared/AppointmentsList";
import { AppointmentDetail } from "../shared/AppointmentDetail";

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
    <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
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

      <AppointmentsList
        variant="business"
        appointments={appointments}
        services={services}
        resources={resources}
        emptyLabel="No hay citas para los filtros actuales."
        onView={setViewingAppointment}
        onComplete={(appointmentId) => updateAppointmentStatus(appointmentId, "completed")}
        onCancel={(appointmentId) => updateAppointmentStatus(appointmentId, "cancelled")}
      />

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
          <AppointmentDetail
            variant="business"
            appointment={viewingAppointment}
            services={services}
            resources={resources}
          />
        )}
      </Modal>
    </section>
  );
}
