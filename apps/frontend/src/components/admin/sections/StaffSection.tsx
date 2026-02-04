import React from "react";
import { ResourceItem, StaffItem } from "../types";
import { InputField } from "../components/InputField";
import { StaffEditor } from "../components/StaffEditor";

export function StaffSection({
  staff,
  resources,
  editingStaffId,
  setEditingStaffId,
  createStaff,
  updateStaff,
  loadStaff
}: {
  staff: StaffItem[];
  resources: ResourceItem[];
  editingStaffId: string | null;
  setEditingStaffId: (value: string | null) => void;
  createStaff: (event: React.FormEvent<HTMLFormElement>) => void;
  updateStaff: (
    staffId: string,
    payload: { resourceId?: string; password?: string; active?: boolean }
  ) => void;
  loadStaff: () => void;
}) {
  return (
    <section className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Staff</h3>
        <button className="text-xs text-slate-500" onClick={() => void loadStaff()}>
          Refrescar
        </button>
      </div>
      <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={createStaff}>
        <InputField name="email" label="Email" type="email" />
        <InputField name="password" label="Password" type="password" />
        <label className="block text-sm font-medium">
          Recurso
          <select
            name="resourceId"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          >
            <option value="">Selecciona</option>
            {resources.map((resource) => (
              <option key={resource._id} value={resource._id}>
                {resource.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="rounded-xl bg-primary-600 px-4 py-2 text-white md:col-span-3"
          type="submit"
        >
          Crear staff
        </button>
      </form>
      <div className="mt-6 space-y-2">
        {staff.map((member) => (
          <div key={member._id} className="card-muted p-3">
            {editingStaffId === member._id ? (
              <StaffEditor
                item={member}
                resources={resources}
                onCancel={() => setEditingStaffId(null)}
                onSave={(payload) => updateStaff(member._id, payload)}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{member.email}</p>
                  <p className="text-xs text-slate-500">{member.active ? "Activo" : "Inactivo"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                    onClick={() => setEditingStaffId(member._id)}
                  >
                    Editar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {staff.length === 0 && <p className="text-sm text-slate-500">No hay staff creado.</p>}
      </div>
    </section>
  );
}
