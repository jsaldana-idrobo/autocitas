import React, { useState } from "react";
import { BusinessProfile } from "../../types";
import { InputField } from "../../components/InputField";
import { Modal } from "../../ui/Modal";
import { SectionHeader } from "../../ui/SectionHeader";

export function BusinessSection({
  businessProfile,
  loadBusinessSettings,
  saveBusinessProfile
}: {
  businessProfile: BusinessProfile;
  loadBusinessSettings: () => void;
  saveBusinessProfile: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <SectionHeader
        title="Negocio"
        subtitle="Informacion general del negocio."
        actions={
          <>
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onClick={loadBusinessSettings}
            >
              Refrescar
            </button>
            <button
              className="rounded-xl bg-primary-600 px-3 py-2 text-sm text-white"
              onClick={() => setEditOpen(true)}
            >
              Editar negocio
            </button>
          </>
        }
      />

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <InfoItem label="Nombre" value={businessProfile.name || "-"} />
        <InfoItem label="Slug" value={businessProfile.slug || "-"} />
        <InfoItem label="Zona horaria" value={businessProfile.timezone || "-"} />
        <InfoItem label="Telefono" value={businessProfile.contactPhone || "-"} />
        <InfoItem label="Direccion" value={businessProfile.address || "-"} />
        <InfoItem label="Estado" value={businessProfile.status || "active"} />
      </div>

      <Modal open={editOpen} title="Editar negocio" onClose={() => setEditOpen(false)}>
        <form
          key={`${businessProfile.name ?? ""}-${businessProfile.slug ?? ""}-${businessProfile.timezone ?? ""}`}
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            saveBusinessProfile(event);
            setEditOpen(false);
          }}
        >
          <InputField name="name" label="Nombre" defaultValue={businessProfile.name} />
          <InputField name="slug" label="Slug" defaultValue={businessProfile.slug} />
          <InputField
            name="timezone"
            label="Zona horaria"
            defaultValue={businessProfile.timezone}
          />
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
          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
              onClick={() => setEditOpen(false)}
            >
              Cancelar
            </button>
            <button
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm text-white"
              type="submit"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
