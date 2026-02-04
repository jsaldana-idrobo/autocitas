import React, { useState } from "react";
import { Policies } from "../../types";
import { InputField } from "../../components/InputField";
import { Modal } from "../../ui/Modal";
import { SectionHeader } from "../../ui/SectionHeader";

export function PoliciesSection({
  policies,
  savePolicies
}: {
  policies: Policies | null;
  savePolicies: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const current = policies ?? { cancellationHours: 24, rescheduleLimit: 1, allowSameDay: true };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <SectionHeader
        title="Politicas"
        subtitle="Reglas de cancelacion y reprogramacion."
        actions={
          <button
            className="rounded-xl bg-primary-600 px-3 py-2 text-sm text-white"
            onClick={() => setEditOpen(true)}
          >
            Editar politicas
          </button>
        }
      />

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <InfoItem label="Horas cancelacion" value={`${current.cancellationHours} horas`} />
        <InfoItem label="Limite reprogramacion" value={`${current.rescheduleLimit}`} />
        <InfoItem label="Mismo dia" value={current.allowSameDay ? "Permitido" : "No permitido"} />
      </div>

      <Modal open={editOpen} title="Editar politicas" onClose={() => setEditOpen(false)}>
        <form
          key={policies ? JSON.stringify(policies) : "policies"}
          className="space-y-4"
          onSubmit={(event) => {
            savePolicies(event);
            setEditOpen(false);
          }}
        >
          <InputField
            name="cancellationHours"
            label="Horas cancelacion"
            type="number"
            defaultValue={current.cancellationHours}
          />
          <InputField
            name="rescheduleLimit"
            label="Limite reprogramacion"
            type="number"
            defaultValue={current.rescheduleLimit}
          />
          <label className="flex items-center gap-2 text-sm font-medium">
            <input name="allowSameDay" type="checkbox" defaultChecked={current.allowSameDay} />
            Permitir mismo dia
          </label>
          <div className="flex justify-end gap-2">
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
