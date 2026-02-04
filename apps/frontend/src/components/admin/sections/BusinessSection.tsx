import React from "react";
import { BusinessProfile } from "../types";
import { InputField } from "../components/InputField";

export function BusinessSection({
  businessProfile,
  loadBusinessSettings,
  saveBusinessProfile
}: {
  businessProfile: BusinessProfile;
  loadBusinessSettings: () => void;
  saveBusinessProfile: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Perfil del negocio</h3>
        <button className="text-xs text-slate-500" onClick={() => void loadBusinessSettings()}>
          Refrescar
        </button>
      </div>
      <form
        key={`${businessProfile.name ?? ""}-${businessProfile.slug ?? ""}-${businessProfile.timezone ?? ""}`}
        className="mt-4 grid gap-4 md:grid-cols-2"
        onSubmit={saveBusinessProfile}
      >
        <InputField name="name" label="Nombre" defaultValue={businessProfile.name} />
        <InputField name="slug" label="Slug" defaultValue={businessProfile.slug} />
        <InputField name="timezone" label="Zona horaria" defaultValue={businessProfile.timezone} />
        <InputField
          name="contactPhone"
          label="Telefono"
          defaultValue={businessProfile.contactPhone}
        />
        <InputField name="address" label="Direccion" defaultValue={businessProfile.address} />
        <label className="block text-sm font-medium">
          Estado
          <select
            name="status"
            defaultValue={businessProfile.status || "active"}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </label>
        <button
          className="rounded-xl bg-primary-600 px-4 py-2 text-white md:col-span-2"
          type="submit"
        >
          Guardar negocio
        </button>
      </form>
    </section>
  );
}
