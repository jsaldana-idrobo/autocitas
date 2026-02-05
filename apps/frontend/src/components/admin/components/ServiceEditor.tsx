import React, { useState } from "react";
import { ResourceItem, ServiceItem } from "../types";

export function ServiceEditor({
  item,
  resources,
  onCancel,
  onSave
}: Readonly<{
  item: ServiceItem;
  resources: ResourceItem[];
  onCancel: () => void;
  onSave: (payload: Partial<ServiceItem>) => void;
}>) {
  const [name, setName] = useState(item.name);
  const [durationMinutes, setDurationMinutes] = useState(String(item.durationMinutes));
  const [price, setPrice] = useState(item.price == null ? "" : String(item.price));
  const [allowedResources, setAllowedResources] = useState<string[]>(item.allowedResourceIds ?? []);

  function toggleResource(resourceId: string) {
    setAllowedResources((prev) =>
      prev.includes(resourceId) ? prev.filter((id) => id !== resourceId) : [...prev, resourceId]
    );
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 md:grid-cols-4">
        <input
          className="rounded-xl border border-slate-200 px-3 py-2"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="rounded-xl border border-slate-200 px-3 py-2"
          type="number"
          value={durationMinutes}
          onChange={(event) => setDurationMinutes(event.target.value)}
        />
        <input
          className="rounded-xl border border-slate-200 px-3 py-2"
          type="number"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
        <div className="flex items-center gap-2">
          <button
            className="rounded-xl bg-primary-600 px-3 py-1 text-xs text-white"
            onClick={() => {
              const durationValue =
                durationMinutes.trim() === "" ? item.durationMinutes : Number(durationMinutes);
              const priceValue = (() => {
                const trimmed = price.trim();
                if (trimmed === "") return undefined;
                const numeric = Number(price);
                return Number.isNaN(numeric) ? undefined : numeric;
              })();
              onSave({
                name,
                durationMinutes: durationValue,
                price: priceValue,
                allowedResourceIds: allowedResources
              });
            }}
          >
            Guardar
          </button>
          <button
            className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
      </div>
      <div className="card-muted p-3">
        <p className="text-xs font-medium uppercase text-slate-500">Recursos permitidos</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {resources.map((resource) => (
            <label key={resource._id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allowedResources.includes(resource._id)}
                onChange={() => toggleResource(resource._id)}
              />
              {resource.name}
            </label>
          ))}
          {resources.length === 0 && (
            <span className="text-xs text-slate-400">No hay recursos.</span>
          )}
        </div>
      </div>
    </div>
  );
}
