import React, { useState } from "react";
import { ResourceItem, StaffItem } from "../types";

export function StaffEditor({
  item,
  resources,
  onCancel,
  onSave
}: {
  item: StaffItem;
  resources: ResourceItem[];
  onCancel: () => void;
  onSave: (payload: { resourceId?: string; password?: string; active?: boolean }) => void;
}) {
  const [staffResource, setStaffResource] = useState(item.resourceId ?? "");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(item.active);

  return (
    <div className="grid gap-2 md:grid-cols-4">
      <select
        className="rounded-xl border border-slate-200 px-3 py-2"
        value={staffResource}
        onChange={(event) => setStaffResource(event.target.value)}
      >
        <option value="">Sin recurso</option>
        {resources.map((resource) => (
          <option key={resource._id} value={resource._id}>
            {resource.name}
          </option>
        ))}
      </select>
      <input
        className="rounded-xl border border-slate-200 px-3 py-2"
        placeholder="Nuevo password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
        />
        Activo
      </label>
      <div className="flex items-center gap-2">
        <button
          className="rounded-xl bg-primary-600 px-3 py-1 text-xs text-white"
          onClick={() =>
            onSave({
              resourceId: staffResource || undefined,
              password: password || undefined,
              active
            })
          }
        >
          Guardar
        </button>
        <button className="rounded-xl border border-slate-200 px-3 py-1 text-xs" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
