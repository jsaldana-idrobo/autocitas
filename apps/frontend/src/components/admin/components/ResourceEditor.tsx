import React, { useState } from "react";
import { ResourceItem } from "../types";

export function ResourceEditor({
  item,
  onCancel,
  onSave
}: {
  item: ResourceItem;
  onCancel: () => void;
  onSave: (payload: Partial<ResourceItem>) => void;
}) {
  const [name, setName] = useState(item.name);
  const [active, setActive] = useState(item.active);

  return (
    <div className="grid gap-2 md:grid-cols-3">
      <input
        className="rounded-xl border border-slate-200 px-3 py-2"
        value={name}
        onChange={(event) => setName(event.target.value)}
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
          onClick={() => onSave({ name, active })}
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
