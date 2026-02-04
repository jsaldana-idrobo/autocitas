import React from "react";
import { Policies } from "../types";
import { InputField } from "../components/InputField";

export function PoliciesSection({
  policies,
  savePolicies
}: {
  policies: Policies | null;
  savePolicies: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="card p-6">
      <h3 className="text-lg font-semibold">Politicas</h3>
      <form
        key={policies ? JSON.stringify(policies) : "policies"}
        className="mt-4 space-y-4"
        onSubmit={savePolicies}
      >
        <InputField
          name="cancellationHours"
          label="Horas cancelacion"
          type="number"
          defaultValue={policies?.cancellationHours ?? 24}
        />
        <InputField
          name="rescheduleLimit"
          label="Limite reprogramacion"
          type="number"
          defaultValue={policies?.rescheduleLimit ?? 1}
        />
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            name="allowSameDay"
            type="checkbox"
            defaultChecked={policies?.allowSameDay ?? true}
          />
          Permitir mismo dia
        </label>
        <button className="rounded-xl bg-primary-600 px-4 py-2 text-white" type="submit">
          Guardar politicas
        </button>
      </form>
    </section>
  );
}
