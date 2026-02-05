import React, { useCallback, useMemo, useState } from "react";
import { apiRequest } from "../../../../lib/api";
import {
  AppointmentItem,
  BlockItem,
  BusinessProfile,
  ResourceItem,
  ServiceItem
} from "../../types";
import { addDays, getWeekStartValue, toIsoIfPossible } from "../../utils";
import { CalendarSection } from "../CalendarSection";

export function PlatformCalendarSection({
  businesses,
  resources,
  services,
  authHeaders,
  onError,
  onSuccess,
  onLoading
}: {
  businesses: BusinessProfile[];
  resources: ResourceItem[];
  services: ServiceItem[];
  authHeaders: { token: string };
  onError: (message: string | null) => void;
  onSuccess: (message: string | null) => void;
  onLoading: (value: boolean) => void;
}) {
  const [selectedBusinessId, setSelectedBusinessId] = useState(businesses[0]?._id ?? "");
  const [weekStart, setWeekStart] = useState(getWeekStartValue());
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const fireAndForget = useCallback((promise: Promise<unknown>) => {
    promise.catch(() => {});
  }, []);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => resource.businessId === selectedBusinessId);
  }, [resources, selectedBusinessId]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => service.businessId === selectedBusinessId);
  }, [services, selectedBusinessId]);

  const loadCalendarData = useCallback(
    async (nextWeekStart = weekStart, businessId = selectedBusinessId) => {
      if (!businessId) {
        setAppointments([]);
        setBlocks([]);
        return;
      }
      onLoading(true);
      onError(null);
      try {
        const from = `${nextWeekStart}T00:00:00.000Z`;
        const to = `${addDays(nextWeekStart, 7)}T00:00:00.000Z`;
        const [appointmentsData, blocksData] = await Promise.all([
          apiRequest<AppointmentItem[]>(
            `/admin/businesses/${businessId}/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
            authHeaders
          ),
          apiRequest<BlockItem[]>(
            `/admin/businesses/${businessId}/blocks?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
            authHeaders
          )
        ]);
        setAppointments(appointmentsData);
        setBlocks(blocksData);
      } catch (err) {
        onError(err instanceof Error ? err.message : "Error cargando calendario");
      } finally {
        onLoading(false);
      }
    },
    [authHeaders, onError, onLoading, selectedBusinessId, weekStart]
  );

  async function createAppointment(payload: {
    serviceId: string;
    resourceId?: string;
    customerName: string;
    customerPhone: string;
    startTime: string;
  }) {
    if (!selectedBusinessId) return;
    onLoading(true);
    onError(null);
    try {
      const payloadToSend = {
        ...payload,
        startTime: toIsoIfPossible(payload.startTime)
      };
      await apiRequest(`/admin/businesses/${selectedBusinessId}/appointments`, {
        method: "POST",
        body: JSON.stringify(payloadToSend),
        ...authHeaders
      });
      onSuccess("Cita creada.");
      await loadCalendarData();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error creando cita");
    } finally {
      onLoading(false);
    }
  }

  async function updateAppointmentDetails(
    appointmentId: string,
    payload: { serviceId?: string; resourceId?: string; startTime?: string }
  ) {
    if (!selectedBusinessId) return;
    onLoading(true);
    onError(null);
    try {
      const payloadToSend = {
        ...payload,
        startTime: payload.startTime ? toIsoIfPossible(payload.startTime) : undefined
      };
      await apiRequest(
        `/admin/businesses/${selectedBusinessId}/appointments/${appointmentId}/details`,
        {
          method: "PATCH",
          body: JSON.stringify(payloadToSend),
          ...authHeaders
        }
      );
      onSuccess("Cita actualizada.");
      await loadCalendarData();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error actualizando cita");
    } finally {
      onLoading(false);
    }
  }

  async function cancelAppointment(appointmentId: string) {
    if (!selectedBusinessId) return;
    onLoading(true);
    onError(null);
    try {
      await apiRequest(`/admin/businesses/${selectedBusinessId}/appointments/${appointmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "cancelled" }),
        ...authHeaders
      });
      onSuccess("Cita cancelada.");
      await loadCalendarData();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error actualizando cita");
    } finally {
      onLoading(false);
    }
  }

  async function createBlock(payload: {
    startTime: string;
    endTime: string;
    resourceId?: string;
    reason?: string;
  }) {
    if (!selectedBusinessId) return;
    onLoading(true);
    onError(null);
    try {
      const payloadToSend = {
        ...payload,
        startTime: toIsoIfPossible(payload.startTime),
        endTime: toIsoIfPossible(payload.endTime)
      };
      await apiRequest(`/admin/businesses/${selectedBusinessId}/blocks`, {
        method: "POST",
        body: JSON.stringify(payloadToSend),
        ...authHeaders
      });
      onSuccess("Bloqueo creado.");
      await loadCalendarData();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error creando bloqueo");
    } finally {
      onLoading(false);
    }
  }

  React.useEffect(() => {
    if (businesses.length > 0 && !selectedBusinessId) {
      setSelectedBusinessId(businesses[0]._id ?? "");
    }
  }, [businesses, selectedBusinessId]);

  React.useEffect(() => {
    if (selectedBusinessId) {
      fireAndForget(loadCalendarData(weekStart, selectedBusinessId));
    }
  }, [fireAndForget, loadCalendarData, selectedBusinessId, weekStart]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <label className="block text-sm font-medium">
          Negocio
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={selectedBusinessId}
            onChange={(event) => {
              setSelectedBusinessId(event.target.value);
              setSelectedResourceId("");
            }}
          >
            <option value="">Selecciona un negocio</option>
            {businesses.map((business) => (
              <option key={business._id} value={business._id}>
                {business.name ?? business._id}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedBusinessId ? (
        <CalendarSection
          weekStart={weekStart}
          intervalMinutes={intervalMinutes}
          onPrevWeek={() => {
            const prev = addDays(weekStart, -7);
            setWeekStart(prev);
            fireAndForget(loadCalendarData(prev));
          }}
          onNextWeek={() => {
            const next = addDays(weekStart, 7);
            setWeekStart(next);
            fireAndForget(loadCalendarData(next));
          }}
          onIntervalChange={setIntervalMinutes}
          onSelectResource={setSelectedResourceId}
          selectedResourceId={selectedResourceId}
          resources={filteredResources}
          services={filteredServices}
          appointments={appointments}
          blocks={blocks}
          onCreateAppointment={createAppointment}
          onCreateBlock={createBlock}
          onUpdateAppointment={updateAppointmentDetails}
          onCancelAppointment={cancelAppointment}
          userRole="platform_admin"
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Selecciona un negocio para ver el calendario.
        </div>
      )}
    </div>
  );
}
