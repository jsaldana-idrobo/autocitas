import React, { useState } from "react";
import { PlatformUserUpdate, StaffItem } from "../../types";

export function PlatformEditUserForm({
  user,
  onSave,
  onCancel
}: Readonly<{
  user: StaffItem;
  onSave: (payload: PlatformUserUpdate) => void;
  onCancel: () => void;
}>) {
  const [email, setEmail] = useState(user.email);
  const [businessId, setBusinessId] = useState(user.businessId ?? "");
  const [resourceId, setResourceId] = useState(user.resourceId ?? "");
  const [active, setActive] = useState(user.active);
  const [password, setPassword] = useState("");

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="block text-sm font-medium">
        <span>Email</span>
        <input
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="block text-sm font-medium">
        <span>Business ID</span>
        <input
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          value={businessId}
          onChange={(event) => setBusinessId(event.target.value)}
        />
      </label>
      <label className="block text-sm font-medium">
        <span>Resource ID</span>
        <input
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          value={resourceId}
          onChange={(event) => setResourceId(event.target.value)}
        />
      </label>
      <label className="block text-sm font-medium">
        <span>Nuevo password</span>
        <input
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
        />
        <span>Activo</span>
      </label>
      <div className="md:col-span-2 flex justify-end gap-2">
        <button
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
          type="button"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          className="rounded-xl bg-primary-600 px-4 py-2 text-sm text-white"
          type="button"
          onClick={() =>
            onSave({
              email,
              businessId: businessId || undefined,
              resourceId: resourceId || undefined,
              active,
              password: password || undefined
            })
          }
        >
          Guardar
        </button>
      </div>
    </div>
  );
}
