import { useCallback, useRef, useState } from "react";
import { apiRequest } from "../../../lib/api";
import { AppointmentItem, BlockItem } from "../types";
import { addDays, getWeekStartValue, toIsoIfPossible } from "../utils";
import { AdminApiContext } from "./types";

export function useAdminCalendar(api: AdminApiContext) {
  const [calendarWeekStart, setCalendarWeekStart] = useState(getWeekStartValue());
  const [calendarInterval, setCalendarInterval] = useState(30);
  const [calendarResourceId, setCalendarResourceId] = useState("");
  const [calendarAppointments, setCalendarAppointments] = useState<AppointmentItem[]>([]);
  const [calendarBlocks, setCalendarBlocks] = useState<BlockItem[]>([]);
  const [calendarLoaded, setCalendarLoaded] = useState(false);
  const isLoadingRef = useRef(false);

  function startLoad() {
    if (isLoadingRef.current) return false;
    isLoadingRef.current = true;
    return true;
  }

  function endLoad() {
    isLoadingRef.current = false;
  }

  async function loadCalendarData(nextWeekStart = calendarWeekStart) {
    if (!api.businessId) {
      setCalendarAppointments([]);
      setCalendarBlocks([]);
      return;
    }
    if (!startLoad()) return;
    api.setLoading(true);
    api.resetError();
    api.resetSuccess();
    try {
      const from = `${nextWeekStart}T00:00:00.000Z`;
      const to = `${addDays(nextWeekStart, 7)}T00:00:00.000Z`;
      const appointments = await apiRequest<AppointmentItem[]>(
        `/admin/businesses/${api.businessId}/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        api.authHeaders
      );
      const blocks = await apiRequest<BlockItem[]>(
        `/admin/businesses/${api.businessId}/blocks?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        api.authHeaders
      );
      setCalendarAppointments(appointments);
      setCalendarBlocks(blocks);
      setCalendarLoaded(true);
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error cargando calendario");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function createAppointment(payload: {
    serviceId: string;
    resourceId?: string;
    customerName: string;
    customerPhone: string;
    startTime: string;
  }) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      const payloadToSend = {
        ...payload,
        startTime: toIsoIfPossible(payload.startTime)
      };
      await apiRequest(`/admin/businesses/${api.businessId}/appointments`, {
        method: "POST",
        body: JSON.stringify(payloadToSend),
        ...api.authHeaders
      });
      const from = `${calendarWeekStart}T00:00:00.000Z`;
      const to = `${addDays(calendarWeekStart, 7)}T00:00:00.000Z`;
      const [appointments, blocks] = await Promise.all([
        apiRequest<AppointmentItem[]>(
          `/admin/businesses/${api.businessId}/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          api.authHeaders
        ),
        apiRequest<BlockItem[]>(
          `/admin/businesses/${api.businessId}/blocks?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          api.authHeaders
        )
      ]);
      setCalendarAppointments(appointments);
      setCalendarBlocks(blocks);
      setCalendarLoaded(true);
      api.setSuccess("Cita creada.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando cita");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function updateAppointmentDetails(
    appointmentId: string,
    payload: { serviceId?: string; resourceId?: string; startTime?: string }
  ) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      const payloadToSend = {
        ...payload,
        startTime: payload.startTime ? toIsoIfPossible(payload.startTime) : undefined
      };
      await apiRequest(
        `/admin/businesses/${api.businessId}/appointments/${appointmentId}/details`,
        {
          method: "PATCH",
          body: JSON.stringify(payloadToSend),
          ...api.authHeaders
        }
      );
      const from = `${calendarWeekStart}T00:00:00.000Z`;
      const to = `${addDays(calendarWeekStart, 7)}T00:00:00.000Z`;
      const [appointments, blocks] = await Promise.all([
        apiRequest<AppointmentItem[]>(
          `/admin/businesses/${api.businessId}/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          api.authHeaders
        ),
        apiRequest<BlockItem[]>(
          `/admin/businesses/${api.businessId}/blocks?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          api.authHeaders
        )
      ]);
      setCalendarAppointments(appointments);
      setCalendarBlocks(blocks);
      setCalendarLoaded(true);
      api.setSuccess("Cita actualizada.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando cita");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function cancelAppointment(appointmentId: string) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/appointments/${appointmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "cancelled" }),
        ...api.authHeaders
      });
      const from = `${calendarWeekStart}T00:00:00.000Z`;
      const to = `${addDays(calendarWeekStart, 7)}T00:00:00.000Z`;
      const [appointments, blocks] = await Promise.all([
        apiRequest<AppointmentItem[]>(
          `/admin/businesses/${api.businessId}/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          api.authHeaders
        ),
        apiRequest<BlockItem[]>(
          `/admin/businesses/${api.businessId}/blocks?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          api.authHeaders
        )
      ]);
      setCalendarAppointments(appointments);
      setCalendarBlocks(blocks);
      setCalendarLoaded(true);
      api.setSuccess("Cita cancelada.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando cita");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function createCalendarBlock(payload: {
    startTime: string;
    endTime: string;
    resourceId?: string;
    reason?: string;
  }) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      const payloadToSend = {
        ...payload,
        startTime: toIsoIfPossible(payload.startTime),
        endTime: toIsoIfPossible(payload.endTime)
      };
      await apiRequest(`/admin/businesses/${api.businessId}/blocks`, {
        method: "POST",
        body: JSON.stringify(payloadToSend),
        ...api.authHeaders
      });
      const from = `${calendarWeekStart}T00:00:00.000Z`;
      const to = `${addDays(calendarWeekStart, 7)}T00:00:00.000Z`;
      const [appointments, blocks] = await Promise.all([
        apiRequest<AppointmentItem[]>(
          `/admin/businesses/${api.businessId}/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          api.authHeaders
        ),
        apiRequest<BlockItem[]>(
          `/admin/businesses/${api.businessId}/blocks?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          api.authHeaders
        )
      ]);
      setCalendarAppointments(appointments);
      setCalendarBlocks(blocks);
      setCalendarLoaded(true);
      api.setSuccess("Bloqueo creado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando bloqueo");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  const resetLoaded = useCallback(() => {
    setCalendarLoaded(false);
  }, []);

  return {
    calendarWeekStart,
    setCalendarWeekStart,
    calendarInterval,
    setCalendarInterval,
    calendarResourceId,
    setCalendarResourceId,
    calendarAppointments,
    calendarBlocks,
    calendarLoaded,
    loadCalendarData,
    createAppointment,
    updateAppointmentDetails,
    cancelAppointment,
    createCalendarBlock,
    resetLoaded
  };
}
