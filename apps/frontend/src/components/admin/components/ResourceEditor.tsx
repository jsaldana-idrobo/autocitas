import React, { useState } from "react";
import { ResourceItem } from "../types";

export function ResourceEditor({
  item,
  onCancel,
  onSave
}: Readonly<{
  item: ResourceItem;
  onCancel: () => void;
  onSave: (payload: Partial<ResourceItem>) => void;
}>) {
  const [name, setName] = useState(item.name);
  const [slug, setSlug] = useState(item.slug ?? "");
  const [active, setActive] = useState(item.active);

  return (
    <div className="grid gap-2 md:grid-cols-4">
      <input
        className="rounded-xl border border-slate-200 px-3 py-2"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nombre"
      />
      <input
        className="rounded-xl border border-slate-200 px-3 py-2"
        value={slug}
        onChange={(event) => setSlug(event.target.value)}
        placeholder="Slug URL (opcional)"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
        />
        <span>Activo</span>
      </label>
      <div className="flex items-center gap-2">
        <button
          className="rounded-xl bg-primary-600 px-3 py-1 text-xs text-white"
          onClick={() => onSave({ name, slug, active })}
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
