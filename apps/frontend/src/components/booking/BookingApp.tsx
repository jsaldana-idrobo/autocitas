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

interface AppointmentItem {
  _id: string;
  serviceId: string;
  resourceId?: string;
  customerName: string;
  customerPhone: string;
  startTime: string;
  endTime: string;
  status: string;
}

const DEFAULT_TIMEZONE = "America/Bogota";
const PHONE_MIN_LEN = 7;
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

function toDateTimeLocalValue(iso: string, timezone: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}T${lookup.hour}:${lookup.minute}`;
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

// eslint-disable-next-line sonarjs/cognitive-complexity
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
  const [manageOpen, setManageOpen] = useState(false);
  const [manageSearchPhone, setManageSearchPhone] = useState("");
  const [manageResults, setManageResults] = useState<AppointmentItem[]>([]);
  const [manageSelected, setManageSelected] = useState<AppointmentItem | null>(null);
  const [manageName, setManageName] = useState("");
  const [managePhone, setManagePhone] = useState("");
  const [manageStartTime, setManageStartTime] = useState("");
  const [manageMessage, setManageMessage] = useState<string | null>(null);

  const normalizedPhone = normalizePhone(customerPhone);
  const normalizedManagePhone = normalizePhone(manageSearchPhone);
  const normalizedManageEditPhone = normalizePhone(managePhone);
  const canSubmit =
    !!serviceId &&
    !!selectedSlot &&
    customerName.trim().length > 0 &&
    normalizedPhone.length >= PHONE_MIN_LEN;
  const canSearch = normalizedManagePhone.length >= PHONE_MIN_LEN && !loading;
  const originalStartLocal = manageSelected
    ? toDateTimeLocalValue(manageSelected.startTime, timezone)
    : "";
  const nameChanged = !!manageSelected && manageName.trim() !== (manageSelected.customerName || "");
  const phoneChanged =
    !!manageSelected && normalizedManageEditPhone !== normalizePhone(manageSelected.customerPhone);
  const phoneValid = normalizedManageEditPhone.length >= PHONE_MIN_LEN;
  const timeChanged = !!manageSelected && manageStartTime !== originalStartLocal;
  const canUpdate =
    Boolean(manageSelected) &&
    normalizedManagePhone.length >= PHONE_MIN_LEN &&
    !loading &&
    (nameChanged || timeChanged || (phoneChanged && phoneValid));
  const canCancel = Boolean(manageSelected) && normalizedManagePhone.length >= PHONE_MIN_LEN;

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

  async function handleSearchAppointments() {
    if (normalizedManagePhone.length < PHONE_MIN_LEN) {
      setManageMessage("Ingresa un telefono valido.");
      return;
    }
    setLoading(true);
    setManageMessage(null);
    try {
      const data = await apiRequest<{ appointments: AppointmentItem[] }>(
        `/public/businesses/${slug}/appointments?phone=${encodeURIComponent(normalizedManagePhone)}`
      );
      setManageResults(data.appointments);
      if (manageSelected) {
        const refreshed = data.appointments.find((item) => item._id === manageSelected._id) ?? null;
        setManageSelected(refreshed);
        if (refreshed) {
          setManageName(refreshed.customerName);
          setManagePhone(refreshed.customerPhone);
          setManageStartTime(toDateTimeLocalValue(refreshed.startTime, timezone));
        }
      }
      if (data.appointments.length === 0) {
        setManageMessage("No encontramos citas con ese telefono.");
      }
    } catch (err) {
      setManageMessage(err instanceof Error ? err.message : "No se pudo buscar la cita");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateAppointment() {
    if (!manageSelected || normalizedManagePhone.length < PHONE_MIN_LEN) {
      setManageMessage("Selecciona una cita y confirma tu telefono.");
      return;
    }
    if (!nameChanged && !phoneChanged && !timeChanged) {
      setManageMessage("No hay cambios para guardar.");
      return;
    }
    if (phoneChanged && normalizedManageEditPhone.length < PHONE_MIN_LEN) {
      setManageMessage("Ingresa un telefono valido para actualizarlo.");
      return;
    }
    setLoading(true);
    setManageMessage(null);
    try {
      await apiRequest(`/public/businesses/${slug}/appointments/${manageSelected._id}/update`, {
        method: "POST",
        body: JSON.stringify({
          customerPhone: normalizedManagePhone,
          customerName: nameChanged ? manageName : undefined,
          newCustomerPhone: phoneChanged ? normalizedManageEditPhone : undefined,
          startTime: timeChanged ? manageStartTime : undefined
        })
      });
      setManageMessage("Cita actualizada correctamente.");
      await handleSearchAppointments();
    } catch (err) {
      setManageMessage(err instanceof Error ? err.message : "No se pudo actualizar la cita");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelAppointment() {
    if (!manageSelected || normalizedManagePhone.length < PHONE_MIN_LEN) {
      setManageMessage("Selecciona una cita y confirma tu telefono.");
      return;
    }
    setLoading(true);
    setManageMessage(null);
    try {
      await apiRequest(`/public/businesses/${slug}/appointments/${manageSelected._id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ customerPhone: normalizedManagePhone })
      });
      setManageMessage("Cita cancelada correctamente.");
      await handleSearchAppointments();
    } catch (err) {
      setManageMessage(err instanceof Error ? err.message : "No se pudo cancelar la cita");
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
            <button
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
              onClick={() => {
                setManageOpen(true);
                setManageResults([]);
                setManageSelected(null);
                setManageMessage(null);
              }}
            >
              Gestionar una cita existente
            </button>
          </div>
        </aside>
      </div>

      {manageOpen && (
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
                onClick={() => setManageOpen(false)}
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
                className={`rounded-xl bg-primary-600 px-4 py-2 text-sm text-white ${
                  !canSearch ? DISABLED_OPACITY : ""
                }`}
                onClick={() => void handleSearchAppointments()}
                disabled={!canSearch}
              >
                Buscar
              </button>
            </div>

            {manageMessage && (
              <p className="mt-4 rounded-md bg-slate-50 p-2 text-sm text-slate-700">
                {manageMessage}
              </p>
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
                        className={`rounded-xl bg-primary-600 px-4 py-2 text-sm text-white ${
                          !canUpdate ? DISABLED_OPACITY : ""
                        }`}
                        onClick={() => void handleUpdateAppointment()}
                        disabled={!canUpdate}
                      >
                        Guardar cambios
                      </button>
                      <button
                        className={`rounded-xl border border-rose-200 px-4 py-2 text-sm text-rose-600 ${
                          !canCancel ? DISABLED_OPACITY : ""
                        }`}
                        onClick={() => void handleCancelAppointment()}
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
      )}
    </>
  );
}
