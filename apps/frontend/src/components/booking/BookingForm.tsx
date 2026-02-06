import React from "react";
import type { AvailabilitySlot, BusinessResponse, ResourceItem, ServiceItem } from "./types";
import {
  DISABLED_OPACITY,
  INPUT_CLASS,
  LABEL_PHONE,
  formatDateTime,
  formatTime,
  getTodayInTimezone
} from "./utils";

type BookingFormProps = {
  business: BusinessResponse;
  serviceId: string;
  date: string;
  resourceId: string;
  availableResources: ResourceItem[];
  slots: AvailabilitySlot[];
  selectedSlot: string | null;
  customerName: string;
  customerPhone: string;
  error: string | null;
  confirmation: string | null;
  loading: boolean;
  canSubmit: boolean;
  service: ServiceItem | null;
  timezone: string;
  onServiceChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onResourceChange: (value: string) => void;
  onSlotSelect: (value: string) => void;
  onBooking: () => void;
  onCustomerNameChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
  onOpenManage: () => void;
};

export function BookingForm({
  business,
  serviceId,
  date,
  resourceId,
  availableResources,
  slots,
  selectedSlot,
  customerName,
  customerPhone,
  error,
  confirmation,
  loading,
  canSubmit,
  service,
  timezone,
  onServiceChange,
  onDateChange,
  onResourceChange,
  onSlotSelect,
  onBooking,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onOpenManage
}: BookingFormProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="card p-6">
        <h2 className="text-2xl font-semibold">{business.business.name}</h2>
        <p className="mt-2 text-sm text-slate-500">Reserva tu cita en minutos</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium">
            <span>Servicio</span>
            <select
              className={`mt-1 w-full ${INPUT_CLASS}`}
              value={serviceId}
              onChange={(event) => onServiceChange(event.target.value)}
            >
              {business.services.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} ({item.durationMinutes} min)
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            <span>Fecha</span>
            <input
              type="date"
              value={date}
              min={getTodayInTimezone(timezone)}
              onChange={(event) => onDateChange(event.target.value)}
              className={`mt-1 w-full ${INPUT_CLASS}`}
            />
          </label>
          <label className="block text-sm font-medium">
            <span>Profesional</span>
            <select
              className={`mt-1 w-full ${INPUT_CLASS}`}
              value={resourceId}
              onChange={(event) => onResourceChange(event.target.value)}
            >
              <option value="">Cualquiera</option>
              {availableResources.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium">Horarios disponibles</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {slots.length === 0 && (
              <span className="text-sm text-slate-500">Sin disponibilidad para esta fecha.</span>
            )}
            {slots.map((slot) => (
              <button
                key={slot.startTime}
                className={`rounded-full px-3 py-2 text-sm ${
                  selectedSlot === slot.startTime
                    ? "bg-primary-600 text-white"
                    : "bg-white text-slate-700 shadow-sm"
                }`}
                onClick={() => onSlotSelect(slot.startTime)}
              >
                {formatTime(slot.startTime, timezone)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside className="card p-6">
        <h3 className="text-lg font-semibold">Confirmar reserva</h3>
        <p className="mt-1 text-sm text-slate-500">Completa tus datos.</p>
        {error && <p className="mt-4 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        {confirmation && (
          <p className="mt-4 rounded-md bg-green-50 p-2 text-sm text-green-700">{confirmation}</p>
        )}
        <div className="mt-4 space-y-3">
          <input
            placeholder="Nombre"
            value={customerName}
            onChange={(event) => onCustomerNameChange(event.target.value)}
            className={`w-full ${INPUT_CLASS}`}
          />
          <input
            placeholder={LABEL_PHONE}
            type="tel"
            value={customerPhone}
            onChange={(event) => onCustomerPhoneChange(event.target.value)}
            className={`w-full ${INPUT_CLASS}`}
          />
          <button
            className={`w-full rounded-xl bg-primary-600 px-4 py-2 text-white ${
              !canSubmit || loading ? DISABLED_OPACITY : ""
            }`}
            onClick={onBooking}
            disabled={!canSubmit || loading}
          >
            {loading ? "Procesando..." : "Reservar"}
          </button>
          <div className="text-xs text-slate-500">
            Servicio: {service?.name ?? "-"} · {service?.durationMinutes ?? "-"} min
            <div>Horario: {selectedSlot ? formatDateTime(selectedSlot, timezone) : "-"}</div>
          </div>
          <button
            className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
            onClick={onOpenManage}
          >
            Gestionar una cita existente
          </button>
        </div>
      </aside>
    </div>
  );
}
