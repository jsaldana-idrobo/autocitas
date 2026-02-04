import React from "react";
import { intervalOptions } from "./constants";
import { ResourceItem } from "../../types";

export function CalendarHeader({
  weekStart,
  intervalMinutes,
  onPrevWeek,
  onNextWeek,
  onIntervalChange,
  canSelectResource,
  selectedResourceId,
  onSelectResource,
  resources,
  onCreateAppointment,
  onCreateBlock
}: {
  weekStart: string;
  intervalMinutes: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onIntervalChange: (value: number) => void;
  canSelectResource: boolean;
  selectedResourceId: string;
  onSelectResource: (value: string) => void;
  resources: ResourceItem[];
  onCreateAppointment: () => void;
  onCreateBlock: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold">Calendario semanal</h3>
        <p className="text-xs text-slate-500">Lunes a domingo · {weekStart}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className="rounded-xl border border-slate-200 px-3 py-1 text-xs" onClick={onPrevWeek}>
          Semana anterior
        </button>
        <button className="rounded-xl border border-slate-200 px-3 py-1 text-xs" onClick={onNextWeek}>
          Semana siguiente
        </button>
        <select
          className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
          value={intervalMinutes}
          onChange={(event) => onIntervalChange(Number(event.target.value))}
        >
          {intervalOptions.map((value) => (
            <option key={value} value={value}>
              {value} min
            </option>
          ))}
        </select>
        {canSelectResource && (
          <select
            className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
            value={selectedResourceId}
            onChange={(event) => onSelectResource(event.target.value)}
          >
            <option value="">Todos los recursos</option>
            {resources.map((res) => (
              <option key={res._id} value={res._id}>
                {res.name}
              </option>
            ))}
          </select>
        )}
        <button className="rounded-xl bg-primary-600 px-3 py-1 text-xs text-white" onClick={onCreateAppointment}>
          Nueva cita
        </button>
        <button className="rounded-xl border border-slate-200 px-3 py-1 text-xs" onClick={onCreateBlock}>
          Bloquear horario
        </button>
      </div>
    </div>
  );
}
