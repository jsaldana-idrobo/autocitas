import { useCallback, useRef, useState } from "react";
import { apiRequest } from "../../../../lib/api";
import { AppointmentItem, PaginatedResponse } from "../../types";
import { AdminApiContext } from "../types";
import { createPaginationParams, type PlatformLoadGuard } from "./utils";

type AppointmentsState = {
  platformAppointments: AppointmentItem[];
  platformAppointmentsTotal: number;
  platformAppointmentsDate: string;
  platformAppointmentsStatus: string;
  platformAppointmentsSearch: string;
  platformAppointmentsLoaded: boolean;
};

type AppointmentsActions = {
  setPlatformAppointmentsDate: (value: string) => void;
  setPlatformAppointmentsStatus: (value: string) => void;
  setPlatformAppointmentsSearch: (value: string) => void;
  loadPlatformAppointments: (
    nextDate?: string,
    nextStatus?: string,
    nextSearch?: string,
    page?: number,
    limit?: number
  ) => Promise<void>;
  resetAppointmentsLoaded: () => void;
};

export function useAdminPlatformAppointments(
  api: AdminApiContext,
  loadGuard: PlatformLoadGuard
): AppointmentsState & AppointmentsActions {
  const { startLoad, endLoad } = loadGuard;
  const [platformAppointments, setPlatformAppointments] = useState<AppointmentItem[]>([]);
  const [platformAppointmentsTotal, setPlatformAppointmentsTotal] = useState(0);
  const [platformAppointmentsDate, setPlatformAppointmentsDate] = useState("");
  const [platformAppointmentsStatus, setPlatformAppointmentsStatus] = useState("");
  const [platformAppointmentsSearch, setPlatformAppointmentsSearch] = useState("");
  const [platformAppointmentsLoaded, setPlatformAppointmentsLoaded] = useState(false);
  const appointmentsQueryRef = useRef({ page: 1, limit: 25 });

  const loadPlatformAppointments = useCallback(
    async (nextDate?: string, nextStatus?: string, nextSearch?: string, page = 1, limit = 25) => {
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        const params = createPaginationParams(page, limit);
        const dateValue = nextDate ?? platformAppointmentsDate;
        const statusValue = nextStatus ?? platformAppointmentsStatus;
        const searchValue = nextSearch ?? platformAppointmentsSearch;
        appointmentsQueryRef.current = { page, limit };
        if (dateValue) params.set("date", dateValue);
        if (statusValue) params.set("status", statusValue);
        if (searchValue) params.set("search", searchValue);
        const query = params.toString() ? `?${params.toString()}` : "";
        const data = await apiRequest<PaginatedResponse<AppointmentItem>>(
          `/admin/platform/appointments${query}`,
          api.authHeaders
        );
        setPlatformAppointments(data.items);
        setPlatformAppointmentsTotal(data.total);
        setPlatformAppointmentsLoaded(true);
      } catch (err) {
        api.setError(err instanceof Error ? err.message : "Error cargando citas globales");
      } finally {
        api.setLoading(false);
        endLoad();
      }
    },
    [
      api,
      endLoad,
      platformAppointmentsDate,
      platformAppointmentsSearch,
      platformAppointmentsStatus,
      startLoad
    ]
  );

  const resetAppointmentsLoaded = () => setPlatformAppointmentsLoaded(false);

  return {
    platformAppointments,
    platformAppointmentsTotal,
    platformAppointmentsDate,
    setPlatformAppointmentsDate,
    platformAppointmentsStatus,
    setPlatformAppointmentsStatus,
    platformAppointmentsSearch,
    setPlatformAppointmentsSearch,
    platformAppointmentsLoaded,
    loadPlatformAppointments,
    resetAppointmentsLoaded
  };
}
