import React, { useEffect, useState } from "react";
import { AppointmentItem } from "../../types";
import { SectionHeader } from "../../ui/SectionHeader";
import { Modal } from "../../ui/Modal";
import { Pagination } from "../../ui/Pagination";
import { AppointmentsList } from "../shared/AppointmentsList";
import { AppointmentDetail } from "../shared/AppointmentDetail";

export function PlatformAppointmentsTable({
  appointments,
  date,
  status,
  search,
  setDate,
  setStatus,
  setSearch,
  onSearch,
  onRefresh,
  total
}: Readonly<{
  appointments: AppointmentItem[];
  date: string;
  status: string;
  search: string;
  setDate: (value: string) => void;
  setStatus: (value: string) => void;
  setSearch: (value: string) => void;
  onSearch: (page?: number, limit?: number) => void;
  onRefresh: (page?: number, limit?: number) => void;
  total: number;
}>) {
  const [viewingAppointment, setViewingAppointment] = useState<AppointmentItem | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  React.useEffect(() => {
    setPage(1);
  }, [date, status, search]);

  useEffect(() => {
    onSearch(page, pageSize);
  }, [page, pageSize, onSearch]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
      <SectionHeader
        title="Citas globales"
        subtitle="Visibilidad de citas por toda la plataforma."
        actions={
          <button
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            onClick={() => onRefresh(page, pageSize)}
          >
            Refrescar
          </button>
        }
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="date"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Todos</option>
          <option value="booked">Reservadas</option>
          <option value="completed">Completadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Buscar por nombre o telefono"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button
          className="rounded-xl bg-primary-600 px-4 py-2 text-sm text-white"
          onClick={() => onSearch(1, pageSize)}
        >
          Buscar
        </button>
      </div>

      <AppointmentsList
        variant="platform"
        appointments={appointments}
        emptyLabel="No hay citas para los filtros actuales."
        onView={setViewingAppointment}
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
          <AppointmentDetail variant="platform" appointment={viewingAppointment} />
        )}
      </Modal>
    </section>
  );
}
