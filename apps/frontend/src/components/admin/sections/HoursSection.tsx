import React from "react";
import { BusinessHoursItem, dayLabels } from "../types";

export function HoursSection({
  hours,
  saveHours
}: {
  hours: BusinessHoursItem[];
  saveHours: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="card p-6">
      <h3 className="text-lg font-semibold">Horarios</h3>
      <form
        key={
          hours.length
            ? hours.map((item) => `${item.dayOfWeek}:${item.openTime}:${item.closeTime}`).join("|")
            : "hours"
        }
        className="mt-4 space-y-3"
        onSubmit={saveHours}
      >
        {dayLabels.map((label, index) => {
          const current = hours.find((item) => item.dayOfWeek === index);
          return (
            <div key={label} className="grid grid-cols-3 gap-2">
              <div className="self-center text-sm font-medium">{label}</div>
              <input
                name={`open-${index}`}
                placeholder="09:00"
                defaultValue={current?.openTime ?? ""}
                className="rounded-xl border border-slate-200 px-3 py-2"
              />
              <input
                name={`close-${index}`}
                placeholder="18:00"
                defaultValue={current?.closeTime ?? ""}
                className="rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>
          );
        })}
        <button className="rounded-xl bg-primary-600 px-4 py-2 text-white" type="submit">
          Guardar horarios
        </button>
      </form>
    </section>
  );
}
