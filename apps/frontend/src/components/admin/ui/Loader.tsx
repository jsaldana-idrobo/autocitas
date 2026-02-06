import React from "react";

export function Loader({ label = "Cargando..." }: Readonly<{ label?: string }>) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
      <span className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600" />
      </span>
      <span className="font-medium">{label}</span>
    </div>
  );
}
