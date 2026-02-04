import { useState } from "react";
import { apiRequest } from "../../../lib/api";
import { AppointmentItem } from "../types";
import { AdminApiContext } from "./types";

export function useAdminAppointments(api: AdminApiContext) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [appointmentsDate, setAppointmentsDate] = useState("");
  const [appointmentsStatus, setAppointmentsStatus] = useState("");
  const [appointmentsSearch, setAppointmentsSearch] = useState("");

  async function loadAppointments(nextDate?: string, nextStatus?: string, nextSearch?: string) {
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
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error cargando citas");
    } finally {
      api.setLoading(false);
    }
  }

  async function updateAppointmentStatus(appointmentId: string, status: string) {
    api.resetError();
    try {
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/appointments/${appointmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        ...api.authHeaders
      });
      await loadAppointments();
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando cita");
    } finally {
      api.setLoading(false);
    }
  }

  return {
    appointments,
    appointmentsDate,
    setAppointmentsDate,
    appointmentsStatus,
    setAppointmentsStatus,
    appointmentsSearch,
    setAppointmentsSearch,
    loadAppointments,
    updateAppointmentStatus
  };
}
