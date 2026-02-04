import React from "react";

export function CalendarSummary({
  todayAppointments,
  weekAppointments,
  blockedCount
}: {
  todayAppointments: number;
  weekAppointments: number;
  blockedCount: number;
}) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <p className="text-xs uppercase text-slate-500">Citas hoy</p>
        <p className="text-lg font-semibold text-slate-900">{todayAppointments}</p>
      </div>
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <p className="text-xs uppercase text-slate-500">Citas semana</p>
        <p className="text-lg font-semibold text-slate-900">{weekAppointments}</p>
      </div>
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <p className="text-xs uppercase text-slate-500">Bloqueos semana</p>
        <p className="text-lg font-semibold text-slate-900">{blockedCount}</p>
      </div>
    </div>
  );
}
