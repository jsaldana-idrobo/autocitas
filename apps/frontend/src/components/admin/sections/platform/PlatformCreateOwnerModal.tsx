import React, { useMemo } from "react";
import { Modal } from "../../ui/Modal";
import { BusinessProfile } from "../../types";
import { BusinessSearchSelect } from "../../components/BusinessSearchSelect";

export function PlatformCreateOwnerModal({
  open,
  onClose,
  ownerBusinessId,
  setOwnerBusinessId,
  onSubmit,
  authHeaders,
  businesses
}: {
  open: boolean;
  onClose: () => void;
  ownerBusinessId: string;
  setOwnerBusinessId: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  authHeaders: { token: string };
  businesses: BusinessProfile[];
}) {
  const businessLookup = useMemo(() => {
    return new Map(businesses.map((business) => [business._id ?? "", business.name ?? ""]));
  }, [businesses]);

  return (
    <Modal open={open} title="Crear owner" onClose={onClose}>
      <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
        <BusinessSearchSelect
          className="md:col-span-2"
          value={ownerBusinessId}
          onChange={setOwnerBusinessId}
          authHeaders={authHeaders}
          initialOptions={businesses}
          selectedLabel={businessLookup.get(ownerBusinessId)}
          required
        />
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
