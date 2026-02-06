import React from "react";
import type { AppointmentItem, BusinessResponse } from "./types";
import { formatDateTime, INPUT_CLASS, LABEL_PHONE, toDateTimeLocalValue } from "./utils";

type ManageAppointmentModalProps = Readonly<{
  open: boolean;
  business: BusinessResponse;
  timezone: string;
  manageSearchPhone: string;
  setManageSearchPhone: (value: string) => void;
  manageResults: AppointmentItem[];
  manageSelected: AppointmentItem | null;
  setManageSelected: (value: AppointmentItem | null) => void;
  manageName: string;
  setManageName: (value: string) => void;
  managePhone: string;
  setManagePhone: (value: string) => void;
  manageStartTime: string;
  setManageStartTime: (value: string) => void;
  manageMessage: string | null;
  onClose: () => void;
  onSearch: () => Promise<void>;
  onUpdate: () => Promise<void>;
  onCancel: () => Promise<void>;
  canSearch: boolean;
  canUpdate: boolean;
  canCancel: boolean;
  searchOpacityClass: string;
  updateOpacityClass: string;
  cancelOpacityClass: string;
  fireAndForget: (promise: Promise<unknown>) => void;
}>;

export function ManageAppointmentModal({
  open,
  business,
  timezone,
  manageSearchPhone,
  setManageSearchPhone,
  manageResults,
  manageSelected,
  setManageSelected,
  manageName,
  setManageName,
  managePhone,
  setManagePhone,
  manageStartTime,
  setManageStartTime,
  manageMessage,
  onClose,
  onSearch,
  onUpdate,
  onCancel,
  canSearch,
  canUpdate,
  canCancel,
  searchOpacityClass,
  updateOpacityClass,
  cancelOpacityClass,
  fireAndForget
}: ManageAppointmentModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Gestionar cita</h3>
            <p className="mt-1 text-sm text-slate-500">
              Busca por telefono, selecciona tu cita y actualiza los datos.
            </p>
          </div>
          <button
            className="rounded-xl border border-slate-200 px-3 py-1 text-sm"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            placeholder={LABEL_PHONE}
            type="tel"
            value={manageSearchPhone}
            onChange={(event) => setManageSearchPhone(event.target.value)}
            className={INPUT_CLASS}
          />
          <button
            className={`rounded-xl bg-primary-600 px-4 py-2 text-sm text-white ${searchOpacityClass}`}
            onClick={() => fireAndForget(onSearch())}
            disabled={!canSearch}
          >
            Buscar
          </button>
        </div>

        {manageMessage && (
          <p className="mt-4 rounded-md bg-slate-50 p-2 text-sm text-slate-700">{manageMessage}</p>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">Tus citas</p>
            <div className="mt-3 space-y-2">
              {manageResults.length === 0 && (
                <p className="text-sm text-slate-500">Sin resultados.</p>
              )}
              {manageResults.map((appt) => {
                const serviceName =
                  business.services.find((item) => item._id === appt.serviceId)?.name ?? "-";
                const resourceName =
                  business.resources.find((item) => item._id === appt.resourceId)?.name ?? "-";
                const isSelected = manageSelected?._id === appt._id;
                return (
                  <button
                    key={appt._id}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                      isSelected ? "border-primary-600 bg-primary-50" : "border-slate-200"
                    }`}
                    onClick={() => {
                      setManageSelected(appt);
                      setManageName(appt.customerName);
                      setManagePhone(appt.customerPhone);
                      setManageStartTime(toDateTimeLocalValue(appt.startTime, timezone));
                    }}
                  >
                    <div className="font-medium">{serviceName}</div>
                    <div className="text-xs text-slate-500">
                      {formatDateTime(appt.startTime, timezone)} · {resourceName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">Actualizar cita</p>
            {manageSelected ? (
              <div className="mt-3 space-y-3">
                <input
                  placeholder="Nombre"
                  value={manageName}
                  onChange={(event) => setManageName(event.target.value)}
                  className={`w-full ${INPUT_CLASS}`}
                />
                <input
                  placeholder="Telefono"
                  value={managePhone}
                  onChange={(event) => setManagePhone(event.target.value)}
                  className={`w-full ${INPUT_CLASS}`}
                />
                <input
                  type="datetime-local"
                  value={manageStartTime}
                  onChange={(event) => setManageStartTime(event.target.value)}
                  className={`w-full ${INPUT_CLASS}`}
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    className={`rounded-xl bg-primary-600 px-4 py-2 text-sm text-white ${updateOpacityClass}`}
                    onClick={() => fireAndForget(onUpdate())}
                    disabled={!canUpdate}
                  >
                    Guardar cambios
                  </button>
                  <button
                    className={`rounded-xl border border-rose-200 px-4 py-2 text-sm text-rose-600 ${cancelOpacityClass}`}
                    onClick={() => fireAndForget(onCancel())}
                    disabled={!canCancel}
                  >
                    Cancelar cita
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Puedes cambiar nombre, telefono o reprogramar la fecha/hora.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Selecciona una cita para editarla.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
