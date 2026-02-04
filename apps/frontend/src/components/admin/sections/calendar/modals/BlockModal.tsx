import React, { useState } from "react";
import { ResourceItem } from "../../../types";

export function BlockModal({
  resources,
  canSelectResource,
  fixedResourceId,
  onSubmit,
  onClose
}: {
  resources: ResourceItem[];
  canSelectResource: boolean;
  fixedResourceId?: string;
  onSubmit: (payload: { startTime: string; endTime: string; resourceId?: string; reason?: string }) => void;
  onClose: () => void;
}) {
  const [resourceId, setResourceId] = useState(fixedResourceId || resources[0]?._id || "");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6">
        <h4 className="text-lg font-semibold">Bloquear horario</h4>
        <div className="mt-4 grid gap-3">
          {canSelectResource ? (
            <select
              className="rounded-xl border border-slate-200 px-3 py-2"
              value={resourceId}
              onChange={(event) => setResourceId(event.target.value)}
            >
              <option value="">Todos</option>
              {resources.map((resource) => (
                <option key={resource._id} value={resource._id}>
                  {resource.name}
                </option>
              ))}
            </select>
          ) : null}
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            type="datetime-local"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            type="datetime-local"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
          />
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            placeholder="Motivo"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-xl border border-slate-200 px-3 py-1 text-sm" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="rounded-xl bg-primary-600 px-3 py-1 text-sm text-white"
            onClick={() => {
              if (!startTime || !endTime) {
                setError("Completa inicio y fin.");
                return;
              }
              if (new Date(endTime) <= new Date(startTime)) {
                setError("El fin debe ser posterior al inicio.");
                return;
              }
              setError("");
              onSubmit({
                startTime,
                endTime,
                resourceId: canSelectResource ? resourceId || undefined : fixedResourceId,
                reason
              });
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
