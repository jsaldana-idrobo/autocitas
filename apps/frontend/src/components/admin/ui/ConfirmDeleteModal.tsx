import React from "react";
import { Modal } from "./Modal";

type ConfirmDeleteModalProps = {
  open: boolean;
  title: string;
  description?: string;
  itemLabel: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteModal({
  open,
  title,
  description,
  itemLabel,
  onClose,
  onConfirm
}: ConfirmDeleteModalProps) {
  return (
    <Modal open={open} title={title} description={description} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Vas a eliminar <strong>{itemLabel}</strong>.
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
            type="button"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm text-white"
            type="button"
            onClick={onConfirm}
          >
            Eliminar
          </button>
        </div>
      </div>
    </Modal>
  );
}
