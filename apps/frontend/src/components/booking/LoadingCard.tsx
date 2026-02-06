import React from "react";

export function LoadingCard({ label = "Cargando..." }: Readonly<{ label?: string }>) {
  const fieldKeys = Array.from({ length: 4 }, (_, idx) => `field-${idx}`);
  const slotKeys = Array.from({ length: 6 }, (_, idx) => `slot-${idx}`);

  return (
    <div className="card p-6">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span className="relative flex h-5 w-5 items-center justify-center">
            <span className="absolute h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600" />
          </span>
          <span className="font-medium">{label}</span>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-48 rounded-full bg-slate-200/80" />
          <div className="h-3 w-64 rounded-full bg-slate-200/80" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {fieldKeys.map((key) => (
            <div key={key} className="h-10 w-full rounded-xl bg-slate-200/80" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {slotKeys.map((key) => (
            <div key={key} className="h-9 w-full rounded-full bg-slate-200/80" />
          ))}
        </div>
      </div>
    </div>
  );
}
