import React from "react";

export function LoadingCard({ label = "Cargando..." }: Readonly<{ label?: string }>) {
  return (
    <div className="card flex items-center gap-3 p-6 text-sm text-slate-600">
      <span className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600" />
      </span>
      <span className="font-medium">{label}</span>
    </div>
  );
}
