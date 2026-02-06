import React, { useEffect, useState } from "react";
import { AppointmentItem } from "../../types";
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
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
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

      <div className="mt-4">
        <DataTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Cliente</TableHeaderCell>
              <TableHeaderCell>Horario</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell>Business ID</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.map((item) => (
              <TableRow key={item._id}>
                <TableCell>
                  <div className="font-medium">{item.customerName}</div>
                  <div className="text-xs text-slate-500">{item.customerPhone}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{new Date(item.startTime).toLocaleString()}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(item.endTime).toLocaleString()}
                  </div>
                </TableCell>
                <TableCell className="capitalize">{item.status}</TableCell>
                <TableCell>{item.businessId ?? "-"}</TableCell>
                <TableCell className="text-right">
                  <button
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                    onClick={() => setViewingAppointment(item)}
                  >
                    Ver
                  </button>
                </TableCell>
              </TableRow>
            ))}
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
              <div className="text-xs uppercase tracking-wide text-slate-400">Business ID</div>
              <div className="font-medium">{viewingAppointment.businessId ?? "-"}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Servicio ID</div>
              <div className="font-medium">{viewingAppointment.serviceId}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Recurso ID</div>
              <div className="font-medium">{viewingAppointment.resourceId ?? "-"}</div>
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
