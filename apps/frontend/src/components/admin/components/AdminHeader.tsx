import React from "react";

export function AdminHeader({
  businessId,
  role,
  onLogout
}: Readonly<{
  businessId: string;
  role: string;
  onLogout: () => void;
}>) {
  return (
    <header className="card flex flex-wrap items-center justify-between gap-4 p-6">
      <div>
        <h2 className="text-2xl font-semibold">Panel admin</h2>
        <p className="text-sm text-slate-500">
          {role === "platform_admin"
            ? `Rol: ${role}`
            : `Business ID: ${businessId || "sin seleccionar"} · Rol: ${role}`}
        </p>
      </div>
      <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm" onClick={onLogout}>
        Cerrar sesion
      </button>
    </header>
  );
}
