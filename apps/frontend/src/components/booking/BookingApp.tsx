import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";

interface BusinessResponse {
  business: {
    _id: string;
    name: string;
    slug: string;
    timezone: string;
  };
  services: ServiceItem[];
  resources: ResourceItem[];
}

interface ServiceItem {
  _id: string;
  name: string;
  durationMinutes: number;
  price?: number;
  allowedResourceIds?: string[];
}

interface ResourceItem {
  _id: string;
  name: string;
}

interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  resourceIds: string[];
}

const DEFAULT_TIMEZONE = "America/Bogota";
const PHONE_MIN_LEN = 7;
const RESCHEDULE_HELP =
  "Para reprogramar, ingresa el ID de la cita, tu telefono y la nueva fecha/hora.";
const LABEL_PHONE = "Telefono";
const INPUT_CLASS = "rounded-xl border border-slate-200 px-3 py-2";
const DISABLED_OPACITY = "opacity-60";

function getTodayInTimezone(timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
}

function formatTime(iso: string, timezone: string) {
  return new Date(iso).toLocaleTimeString("es-CO", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDateTime(iso: string, timezone: string) {
  return new Date(iso).toLocaleString("es-CO", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function normalizePhone(value: string) {
  return value.replace(/\s+/g, "").replace(/[^\d+]/g, "");
}

export function BookingApp({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [resourceId, setResourceId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [appointmentId, setAppointmentId] = useState("");
  const [managePhone, setManagePhone] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [manageMessage, setManageMessage] = useState<string | null>(null);

  const normalizedPhone = normalizePhone(customerPhone);
  const normalizedManagePhone = normalizePhone(managePhone);
  const canSubmit =
    !!serviceId &&
    !!selectedSlot &&
    customerName.trim().length > 0 &&
    normalizedPhone.length >= PHONE_MIN_LEN;
  const canCancel =
    appointmentId.trim().length > 0 && normalizedManagePhone.length >= PHONE_MIN_LEN && !loading;
  const canReschedule =
    canCancel && rescheduleTime.trim().length > 0;

  const service = useMemo(
    () => business?.services.find((item) => item._id === serviceId) ?? null,
    [business, serviceId]
  );

  const availableResources = useMemo(() => {
    if (!business) return [];
    if (!service || !service.allowedResourceIds || service.allowedResourceIds.length === 0) {
      return business.resources;
    }
    return business.resources.filter((resource) =>
      service.allowedResourceIds?.includes(resource._id)
    );
  }, [business, service]);

  const timezone = business?.business.timezone || DEFAULT_TIMEZONE;

  const loadAvailability = useCallback(
    async (selectedDate: string, selectedService: string, selectedResource?: string) => {
      if (!selectedDate || !selectedService) return;
      setLoading(true);
      setError(null);
      try {
        const resourceQuery = selectedResource ? `&resourceId=${selectedResource}` : "";
        const data = await apiRequest<{ slots: AvailabilitySlot[] }>(
          `/public/businesses/${slug}/availability?date=${selectedDate}&serviceId=${selectedService}${resourceQuery}`
        );
        setSlots(data.slots);
        setSelectedSlot(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar disponibilidad");
      } finally {
        setLoading(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    async function loadBusiness() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<BusinessResponse>(`/public/businesses/${slug}`);
        setBusiness(data);
        const defaultServiceId = data.services[0]?._id ?? "";
        setServiceId(defaultServiceId);
        const today = getTodayInTimezone(data.business.timezone || DEFAULT_TIMEZONE);
        setDate(today);
        if (defaultServiceId) {
          void loadAvailability(today, defaultServiceId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el negocio");
      } finally {
        setLoading(false);
      }
    }

    void loadBusiness();
  }, [loadAvailability, slug]);

  async function handleBooking() {
    if (!serviceId || !selectedSlot || !customerName.trim() || !normalizedPhone) {
      setError("Completa todos los datos antes de reservar.");
      return;
    }
    if (normalizedPhone.length < PHONE_MIN_LEN) {
      setError("Ingresa un telefono valido.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<{ appointmentId: string }>(
        `/public/businesses/${slug}/appointments`,
        {
          method: "POST",
          body: JSON.stringify({
            serviceId,
            resourceId: resourceId || undefined,
            startTime: selectedSlot,
            customerName,
            customerPhone: normalizedPhone
          })
        }
      );
      setConfirmation(`Reserva creada: ${response.appointmentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cita");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!appointmentId.trim() || normalizedManagePhone.length < PHONE_MIN_LEN) {
      setManageMessage("Ingresa el ID de la cita y tu telefono.");
      return;
    }
    setLoading(true);
    setError(null);
    setManageMessage(null);
    try {
      await apiRequest(`/public/businesses/${slug}/appointments/${appointmentId.trim()}/cancel`, {
        method: "POST",
        body: JSON.stringify({ customerPhone: normalizedManagePhone })
      });
      setManageMessage("Cita cancelada correctamente.");
    } catch (err) {
      setManageMessage(err instanceof Error ? err.message : "No se pudo cancelar la cita");
    } finally {
      setLoading(false);
    }
  }

  async function handleReschedule() {
    if (!appointmentId.trim() || normalizedManagePhone.length < PHONE_MIN_LEN || !rescheduleTime.trim()) {
      setManageMessage(RESCHEDULE_HELP);
      return;
    }
    setLoading(true);
    setError(null);
    setManageMessage(null);
    try {
      await apiRequest(
        `/public/businesses/${slug}/appointments/${appointmentId.trim()}/reschedule`,
        {
          method: "POST",
          body: JSON.stringify({ customerPhone: normalizedManagePhone, startTime: rescheduleTime })
        }
      );
      setManageMessage("Cita reprogramada correctamente.");
    } catch (err) {
      setManageMessage(err instanceof Error ? err.message : "No se pudo reprogramar la cita");
    } finally {
      setLoading(false);
    }
  }

  if (loading && !business) {
    return <div className="card p-6">Cargando...</div>;
  }

  if (!business) {
    return <div className="card p-6">No se encontro el negocio.</div>;
  }

  if (business.services.length === 0) {
    return <div className="card p-6">Este negocio aun no tiene servicios activos.</div>;
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="card p-6">
        <h2 className="text-2xl font-semibold">{business.business.name}</h2>
        <p className="mt-2 text-sm text-slate-500">
          Reserva tu cita en minutos · Zona horaria {timezone}
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium">
            Servicio
            <select
              className={`mt-1 w-full ${INPUT_CLASS}`}
              value={serviceId}
              onChange={(event) => {
                const nextService = event.target.value;
                setServiceId(nextService);
                setResourceId("");
                setSelectedSlot(null);
                if (date) void loadAvailability(date, nextService);
              }}
            >
              {business.services.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} ({item.durationMinutes} min)
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Fecha
            <input
              type="date"
              value={date}
              min={getTodayInTimezone(timezone)}
              onChange={(event) => {
                setDate(event.target.value);
                void loadAvailability(event.target.value, serviceId, resourceId);
              }}
              className={`mt-1 w-full ${INPUT_CLASS}`}
            />
          </label>
          <label className="block text-sm font-medium">
            Profesional
            <select
              className={`mt-1 w-full ${INPUT_CLASS}`}
              value={resourceId}
              onChange={(event) => {
                const nextResource = event.target.value;
                setResourceId(nextResource);
                if (date) void loadAvailability(date, serviceId, nextResource || undefined);
              }}
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
                onClick={() => setSelectedSlot(slot.startTime)}
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
            onChange={(event) => setCustomerName(event.target.value)}
            className={`w-full ${INPUT_CLASS}`}
          />
          <input
            placeholder={LABEL_PHONE}
            type="tel"
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            className={`w-full ${INPUT_CLASS}`}
          />
          <button
            className={`w-full rounded-xl bg-primary-600 px-4 py-2 text-white ${
              !canSubmit || loading ? DISABLED_OPACITY : ""
            }`}
            onClick={() => void handleBooking()}
            disabled={!canSubmit || loading}
          >
            {loading ? "Procesando..." : "Reservar"}
          </button>
          <div className="text-xs text-slate-500">
            Servicio: {service?.name ?? "-"} · {service?.durationMinutes ?? "-"} min
            <div>Horario: {selectedSlot ? formatDateTime(selectedSlot, timezone) : "-"}</div>
          </div>
        </div>
      </aside>
      </div>
      <section className="card mt-6 p-6">
      <h3 className="text-lg font-semibold">Gestionar cita</h3>
      <p className="mt-1 text-sm text-slate-500">
        Cancela o reprograma una cita existente.
      </p>
      {manageMessage && (
        <p className="mt-4 rounded-md bg-slate-50 p-2 text-sm text-slate-700">{manageMessage}</p>
      )}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <input
          placeholder="ID de la cita"
          value={appointmentId}
          onChange={(event) => setAppointmentId(event.target.value)}
          className={INPUT_CLASS}
        />
        <input
          placeholder={LABEL_PHONE}
          type="tel"
          value={managePhone}
          onChange={(event) => setManagePhone(event.target.value)}
          className={INPUT_CLASS}
        />
        <input
          type="datetime-local"
          value={rescheduleTime}
          onChange={(event) => setRescheduleTime(event.target.value)}
          className={INPUT_CLASS}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className={`rounded-xl border border-slate-200 px-4 py-2 text-sm ${
            !canCancel ? DISABLED_OPACITY : ""
          }`}
          onClick={() => void handleCancel()}
          disabled={!canCancel}
        >
          Cancelar cita
        </button>
        <button
          className={`rounded-xl bg-primary-600 px-4 py-2 text-sm text-white ${
            !canReschedule ? DISABLED_OPACITY : ""
          }`}
          onClick={() => void handleReschedule()}
          disabled={!canReschedule}
        >
          Reprogramar
        </button>
      </div>
      </section>
    </>
  );
}
