import React, { useState } from "react";
import { BlockItem, ResourceItem } from "../types";
import { toIsoIfPossible, toLocalInputValue } from "../utils";

export function BlockEditor({
  item,
  resources,
  canEditResource,
  onCancel,
  onSave
}: Readonly<{
  item: BlockItem;
  resources: ResourceItem[];
  canEditResource: boolean;
  onCancel: () => void;
  onSave: (payload: Partial<BlockItem>) => void;
}>) {
  const [startTime, setStartTime] = useState(item.startTime);
  const [endTime, setEndTime] = useState(item.endTime);
  const [reason, setReason] = useState(item.reason ?? "");
  const [resourceIdValue, setResourceIdValue] = useState(item.resourceId ?? "");

  return (
    <div className="grid gap-2 md:grid-cols-5">
      <input
        className="rounded-xl border border-slate-200 px-3 py-2"
        type="datetime-local"
        value={toLocalInputValue(startTime)}
        onChange={(event) => setStartTime(event.target.value)}
      />
      <input
        className="rounded-xl border border-slate-200 px-3 py-2"
        type="datetime-local"
        value={toLocalInputValue(endTime)}
        onChange={(event) => setEndTime(event.target.value)}
      />
      {canEditResource ? (
        <select
          className="rounded-xl border border-slate-200 px-3 py-2"
          value={resourceIdValue}
          onChange={(event) => setResourceIdValue(event.target.value)}
        >
          <option value="">Todos</option>
          {resources.map((resource) => (
            <option key={resource._id} value={resource._id}>
              {resource.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="card-muted flex items-center px-3 py-2 text-sm text-slate-500">
          Recurso asignado
        </div>
      )}
      <input
        className="rounded-xl border border-slate-200 px-3 py-2"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <div className="flex items-center gap-2">
        <button
          className="rounded-xl bg-primary-600 px-3 py-1 text-xs text-white"
          onClick={() =>
            onSave({
              startTime: toIsoIfPossible(startTime),
              endTime: toIsoIfPossible(endTime),
              reason,
              resourceId: canEditResource ? resourceIdValue || undefined : undefined
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
