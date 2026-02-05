import { useCallback, useRef, useState } from "react";
import { apiRequest } from "../../../lib/api";
import { AppointmentItem, PaginatedResponse } from "../types";
import { AdminApiContext } from "./types";

export function useAdminAppointments(api: AdminApiContext) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [appointmentsTotal, setAppointmentsTotal] = useState(0);
  const [appointmentsDate, setAppointmentsDate] = useState("");
  const [appointmentsStatus, setAppointmentsStatus] = useState("");
  const [appointmentsSearch, setAppointmentsSearch] = useState("");
  const [appointmentsLoaded, setAppointmentsLoaded] = useState(false);
  const isLoadingRef = useRef(false);
  const appointmentsQueryRef = useRef({ page: 1, limit: 25 });

  const startLoad = useCallback(() => {
    if (isLoadingRef.current) return false;
    isLoadingRef.current = true;
    return true;
  }, []);

  const endLoad = useCallback(() => {
    isLoadingRef.current = false;
  }, []);

  const loadAppointments = useCallback(
    async (nextDate?: string, nextStatus?: string, nextSearch?: string, page = 1, limit = 25) => {
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        const params = new URLSearchParams();
        const dateValue = nextDate ?? appointmentsDate;
        const statusValue = nextStatus ?? appointmentsStatus;
        const searchValue = nextSearch ?? appointmentsSearch;
        appointmentsQueryRef.current = { page, limit };
        if (dateValue) params.set("date", dateValue);
        if (statusValue) params.set("status", statusValue);
        if (searchValue) params.set("search", searchValue);
        params.set("page", String(page));
        params.set("limit", String(limit));
        const query = params.toString() ? `?${params.toString()}` : "";
        const data = await apiRequest<PaginatedResponse<AppointmentItem>>(
          `/admin/businesses/${api.businessId}/appointments${query}`,
          api.authHeaders
        );
        setAppointments(data.items);
        setAppointmentsTotal(data.total);
        setAppointmentsLoaded(true);
      } catch (err) {
        api.setError(err instanceof Error ? err.message : "Error cargando citas");
      } finally {
        api.setLoading(false);
        endLoad();
      }
    },
    [api, appointmentsDate, appointmentsSearch, appointmentsStatus, endLoad, startLoad]
  );

  async function updateAppointmentStatus(appointmentId: string, status: string) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/appointments/${appointmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        ...api.authHeaders
      });
      await loadAppointments(
        appointmentsDate,
        appointmentsStatus,
        appointmentsSearch,
        appointmentsQueryRef.current.page,
        appointmentsQueryRef.current.limit
      );
      api.setSuccess("Cita actualizada.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando cita");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  const resetLoaded = useCallback(() => {
    setAppointmentsLoaded(false);
  }, []);

  return {
    appointments,
    appointmentsTotal,
    appointmentsLoaded,
    appointmentsDate,
    setAppointmentsDate,
    appointmentsStatus,
    setAppointmentsStatus,
    appointmentsSearch,
    setAppointmentsSearch,
    loadAppointments,
    updateAppointmentStatus,
    resetLoaded
  };
}
