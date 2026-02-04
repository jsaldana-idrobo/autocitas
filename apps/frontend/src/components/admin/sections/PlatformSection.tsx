import React from "react";
import { AppointmentItem, BusinessProfile, StaffItem } from "../types";
import { InputField } from "../components/InputField";

export function PlatformSection({
  businesses,
  ownerBusinessId,
  setOwnerBusinessId,
  loadBusinesses,
  createBusiness,
  createOwner,
  onSelectBusiness,
  owners,
  staff,
  appointments,
  appointmentsDate,
  setAppointmentsDate,
  appointmentsStatus,
  setAppointmentsStatus,
  appointmentsSearch,
  setAppointmentsSearch,
  loadOwners,
  loadStaff,
  loadAppointments
}: {
  businesses: BusinessProfile[];
  ownerBusinessId: string;
  setOwnerBusinessId: (value: string) => void;
  loadBusinesses: () => void;
  createBusiness: (event: React.FormEvent<HTMLFormElement>) => void;
  createOwner: (event: React.FormEvent<HTMLFormElement>) => void;
  onSelectBusiness: (businessId: string) => void;
  owners: StaffItem[];
  staff: StaffItem[];
  appointments: AppointmentItem[];
  appointmentsDate: string;
  setAppointmentsDate: (value: string) => void;
  appointmentsStatus: string;
  setAppointmentsStatus: (value: string) => void;
  appointmentsSearch: string;
  setAppointmentsSearch: (value: string) => void;
  loadOwners: () => void;
  loadStaff: () => void;
  loadAppointments: () => void;
}) {
  return (
    <section className="card p-6">
      <div className="mb-6 rounded-xl border border-slate-200/60 p-4">
        <h4 className="text-base font-semibold">Negocio seleccionado</h4>
        <p className="text-xs text-slate-500">Selecciona un negocio para operar sus modulos.</p>
        <div className="mt-3">
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={ownerBusinessId}
            onChange={(event) => onSelectBusiness(event.target.value)}
          >
            <option value="">Selecciona un negocio</option>
            {businesses.map((business) => (
              <option key={business._id} value={business._id}>
                {business.name} ({business.slug})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Negocios (Plataforma)</h3>
        <button className="text-xs text-slate-500" onClick={() => void loadBusinesses()}>
          Refrescar
        </button>
      </div>
      <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={createBusiness}>
        <InputField name="name" label="Nombre" />
        <InputField name="slug" label="Slug" />
        <InputField name="timezone" label="Zona horaria" />
        <InputField name="contactPhone" label="Telefono" />
        <InputField name="address" label="Direccion" />
        <label className="block text-sm font-medium">
          Estado
          <select
            name="status"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </label>
        <button
          className="rounded-xl bg-primary-600 px-4 py-2 text-white md:col-span-3"
          type="submit"
        >
          Crear negocio
        </button>
      </form>
      <div className="mt-6 space-y-2">
        {businesses.map((business) => (
          <div
            key={business._id}
            className="card-muted flex flex-wrap items-center justify-between gap-3 p-3"
          >
            <div>
              <p className="font-medium">{business.name}</p>
              <p className="text-xs text-slate-500">{business.slug}</p>
            </div>
            <button
              className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
              onClick={() => onSelectBusiness(String(business._id || ""))}
            >
              Usar este negocio
            </button>
          </div>
        ))}
        {businesses.length === 0 && (
          <p className="text-sm text-slate-500">No hay negocios creados.</p>
        )}
      </div>
      <div className="mt-8 border-t border-slate-200/60 pt-6">
        <h4 className="text-base font-semibold">Crear owner</h4>
        <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={createOwner}>
          <label className="block text-sm font-medium">
            Business ID
            <input
              name="businessId"
              value={ownerBusinessId}
              onChange={(event) => setOwnerBusinessId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              required
            />
          </label>
          <InputField name="email" label="Email owner" type="email" />
          <InputField name="password" label="Password owner" type="password" />
          <button
            className="rounded-xl bg-primary-600 px-4 py-2 text-white md:col-span-3"
            type="submit"
          >
            Crear owner
          </button>
        </form>
      </div>
      <div className="mt-8 border-t border-slate-200/60 pt-6">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold">Owners</h4>
          <button className="text-xs text-slate-500" onClick={() => void loadOwners()}>
            Refrescar
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {owners.map((owner) => (
            <div key={owner._id} className="card-muted flex flex-wrap items-center justify-between gap-3 p-3">
              <div>
                <p className="font-medium">{owner.email}</p>
                <p className="text-xs text-slate-500">{owner.businessId ?? "-"}</p>
              </div>
              <span className="text-xs text-slate-500">{owner.active ? "Activo" : "Inactivo"}</span>
            </div>
          ))}
          {owners.length === 0 && <p className="text-sm text-slate-500">No hay owners.</p>}
        </div>
      </div>
      <div className="mt-8 border-t border-slate-200/60 pt-6">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold">Staff</h4>
          <button className="text-xs text-slate-500" onClick={() => void loadStaff()}>
            Refrescar
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {staff.map((member) => (
            <div key={member._id} className="card-muted flex flex-wrap items-center justify-between gap-3 p-3">
              <div>
                <p className="font-medium">{member.email}</p>
                <p className="text-xs text-slate-500">{member.businessId ?? "-"}</p>
              </div>
              <span className="text-xs text-slate-500">{member.active ? "Activo" : "Inactivo"}</span>
            </div>
          ))}
          {staff.length === 0 && <p className="text-sm text-slate-500">No hay staff.</p>}
        </div>
      </div>
      <div className="mt-8 border-t border-slate-200/60 pt-6">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold">Citas (global)</h4>
          <button className="text-xs text-slate-500" onClick={() => void loadAppointments()}>
            Refrescar
          </button>
        </div>
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
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            placeholder="Buscar por nombre o telefono"
            value={appointmentsSearch}
            onChange={(event) => setAppointmentsSearch(event.target.value)}
          />
          <button className="rounded-xl bg-primary-600 px-4 py-2 text-white" onClick={() => void loadAppointments()}>
            Buscar
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {appointments.map((item) => (
            <div key={item._id} className="card-muted p-3">
              <p className="font-medium">{item.customerName}</p>
              <p className="text-xs text-slate-500">
                {new Date(item.startTime).toLocaleString()} - {new Date(item.endTime).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                {item.customerPhone} · {item.status} · {item.businessId ?? "-"}
              </p>
            </div>
          ))}
          {appointments.length === 0 && (
            <p className="text-sm text-slate-500">No hay citas para los filtros actuales.</p>
          )}
        </div>
      </div>
    </section>
  );
}
