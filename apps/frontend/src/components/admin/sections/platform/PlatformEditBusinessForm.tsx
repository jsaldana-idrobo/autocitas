import React, { useState } from "react";
import { BusinessProfile } from "../../types";

export function PlatformEditBusinessForm({
  business,
  onSave,
  onCancel
}: {
  business: BusinessProfile;
  onSave: (payload: Partial<BusinessProfile>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(business.name ?? "");
  const [slug, setSlug] = useState(business.slug ?? "");
  const [timezone, setTimezone] = useState(business.timezone ?? "");
  const [contactPhone, setContactPhone] = useState(business.contactPhone ?? "");
  const [address, setAddress] = useState(business.address ?? "");
  const [status, setStatus] = useState(business.status ?? "active");

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="block text-sm font-medium">
        Nombre
        <input
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="block text-sm font-medium">
        Slug
        <input
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
        />
      </label>
      <label className="block text-sm font-medium">
        Zona horaria
        <input
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
        />
      </label>
      <label className="block text-sm font-medium">
        Telefono
        <input
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          value={contactPhone}
          onChange={(event) => setContactPhone(event.target.value)}
        />
      </label>
      <label className="block text-sm font-medium md:col-span-2">
        Direccion
        <input
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
      </label>
      <label className="block text-sm font-medium">
        Estado
        <select
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </label>
      <div className="md:col-span-2 flex justify-end gap-2">
        <button
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
          type="button"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          className="rounded-xl bg-primary-600 px-4 py-2 text-sm text-white"
          type="button"
          onClick={() =>
            onSave({
              name,
              slug,
              timezone,
              contactPhone,
              address,
              status: status as "active" | "inactive"
            })
          }
        >
          Guardar
        </button>
      </div>
    </div>
  );
}
