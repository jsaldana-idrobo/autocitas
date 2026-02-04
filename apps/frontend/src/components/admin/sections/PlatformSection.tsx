import React from "react";
import { BusinessProfile } from "../types";
import { InputField } from "../components/InputField";

export function PlatformSection({
  businesses,
  ownerBusinessId,
  setOwnerBusinessId,
  loadBusinesses,
  createBusiness,
  createOwner,
  onSelectBusiness
}: {
  businesses: BusinessProfile[];
  ownerBusinessId: string;
  setOwnerBusinessId: (value: string) => void;
  loadBusinesses: () => void;
  createBusiness: (event: React.FormEvent<HTMLFormElement>) => void;
  createOwner: (event: React.FormEvent<HTMLFormElement>) => void;
  onSelectBusiness: (businessId: string) => void;
}) {
  return (
    <section className="card p-6">
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
    </section>
  );
}
