import React from "react";
import { Modal } from "../../ui/Modal";

export function PlatformCreateOwnerModal({
  open,
  onClose,
  ownerBusinessId,
  setOwnerBusinessId,
  onSubmit
}: {
  open: boolean;
  onClose: () => void;
  ownerBusinessId: string;
  setOwnerBusinessId: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Modal open={open} title="Crear owner" onClose={onClose}>
      <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
        <label className="block text-sm font-medium md:col-span-2">
          Business ID
          <input
            name="businessId"
            value={ownerBusinessId}
            onChange={(event) => setOwnerBusinessId(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            required
          />
        </label>
        <label className="block text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>
        <div className="md:col-span-2 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className="rounded-xl bg-primary-600 px-4 py-2 text-sm text-white" type="submit">
            Crear
          </button>
        </div>
      </form>
    </Modal>
  );
}
