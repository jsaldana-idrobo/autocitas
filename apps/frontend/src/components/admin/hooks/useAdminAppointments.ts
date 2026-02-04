import { useRef, useState } from "react";
import { apiRequest } from "../../../lib/api";
import { AppointmentItem } from "../types";
import { AdminApiContext } from "./types";

export function useAdminAppointments(api: AdminApiContext) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [appointmentsDate, setAppointmentsDate] = useState("");
  const [appointmentsStatus, setAppointmentsStatus] = useState("");
  const [appointmentsSearch, setAppointmentsSearch] = useState("");
  const [appointmentsLoaded, setAppointmentsLoaded] = useState(false);
  const isLoadingRef = useRef(false);

  function startLoad() {
    if (isLoadingRef.current) return false;
    isLoadingRef.current = true;
    return true;
  }

  function endLoad() {
    isLoadingRef.current = false;
  }

  async function loadAppointments(nextDate?: string, nextStatus?: string, nextSearch?: string) {
    if (!startLoad()) return;
    api.setLoading(true);
    api.resetError();
    try {
      const params = new URLSearchParams();
      const dateValue = nextDate ?? appointmentsDate;
      const statusValue = nextStatus ?? appointmentsStatus;
      const searchValue = nextSearch ?? appointmentsSearch;
      if (dateValue) params.set("date", dateValue);
      if (statusValue) params.set("status", statusValue);
      if (searchValue) params.set("search", searchValue);
      const query = params.toString() ? `?${params.toString()}` : "";
      const data = await apiRequest<AppointmentItem[]>(
        `/admin/businesses/${api.businessId}/appointments${query}`,
        api.authHeaders
      );
      setAppointments(data);
      setAppointmentsLoaded(true);
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error cargando citas");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function updateAppointmentStatus(appointmentId: string, status: string) {
    api.resetError();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/appointments/${appointmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        ...api.authHeaders
      });
      setAppointmentsLoaded(false);
      await loadAppointments();
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando cita");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  function resetLoaded() {
    setAppointmentsLoaded(false);
  }

  return {
    appointments,
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
