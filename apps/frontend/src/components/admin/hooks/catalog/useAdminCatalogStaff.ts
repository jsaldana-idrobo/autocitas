import { useCallback, useRef, useState, type FormEvent } from "react";
import { apiRequest } from "../../../../lib/api";
import { PaginatedResponse, StaffItem } from "../../types";
import { AdminApiContext } from "../types";
import { createPaginationParams, readFormString } from "../shared/utils";
import type { CatalogLoadGuard } from "./utils";

type ActiveFilter = "" | "active" | "inactive";

type StaffState = {
  staff: StaffItem[];
  staffTotal: number;
  staffLoaded: boolean;
};

type StaffActions = {
  loadStaff: (
    page?: number,
    limit?: number,
    search?: string,
    active?: ActiveFilter
  ) => Promise<void>;
  createStaff: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  updateStaff: (
    staffId: string,
    payload: { resourceId?: string; password?: string; active?: boolean }
  ) => Promise<void>;
  deleteStaff: (staffId: string) => Promise<void>;
  resetStaffLoaded: () => void;
};

export function useAdminCatalogStaff(
  api: AdminApiContext,
  loadGuard: CatalogLoadGuard
): StaffState & StaffActions {
  const { startLoad, endLoad } = loadGuard;
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [staffTotal, setStaffTotal] = useState(0);
  const [staffLoaded, setStaffLoaded] = useState(false);
  const staffQueryRef = useRef({ page: 1, limit: 25, search: "", active: "" });

  const loadStaff = useCallback(
    async (page = 1, limit = 25, search = "", active: ActiveFilter = "") => {
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        staffQueryRef.current = { page, limit, search, active };
        const params = createPaginationParams(page, limit);
        if (search) params.set("search", search);
        if (active) params.set("active", active === "active" ? "true" : "false");
        const data = await apiRequest<PaginatedResponse<StaffItem>>(
          `/admin/businesses/${api.businessId}/staff?${params.toString()}`,
          api.authHeaders
        );
        setStaff(data.items);
        setStaffTotal(data.total);
        setStaffLoaded(true);
      } catch (err) {
        api.setError(err instanceof Error ? err.message : "Error cargando staff");
      } finally {
        api.setLoading(false);
        endLoad();
      }
    },
    [api, endLoad, startLoad]
  );

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
    api.resetSuccess();
    const form = new FormData(event.currentTarget);
    const payload = {
      email: readFormString(form, "email"),
      password: readFormString(form, "password"),
      resourceId: readFormString(form, "resourceId"),
      role: readFormString(form, "role")
    };

    if (!payload.email || !payload.password || !payload.resourceId) {
      api.setError("Email, password y recurso son obligatorios.");
      return;
    }

    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/staff`, {
        method: "POST",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      event.currentTarget.reset();
      await loadStaff(
        staffQueryRef.current.page,
        staffQueryRef.current.limit,
        staffQueryRef.current.search,
        staffQueryRef.current.active as ActiveFilter
      );
      api.setSuccess("Staff creado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando staff");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function updateStaff(
    staffId: string,
    payload: { resourceId?: string; password?: string; active?: boolean }
  ) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/staff/${staffId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      await loadStaff(
        staffQueryRef.current.page,
        staffQueryRef.current.limit,
        staffQueryRef.current.search,
        staffQueryRef.current.active as ActiveFilter
      );
      api.setSuccess("Staff actualizado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando staff");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function deleteStaff(staffId: string) {
    api.resetError();
    api.resetSuccess();
    try {
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/staff/${staffId}`, {
        method: "DELETE",
        ...api.authHeaders
      });
      await loadStaff(
        staffQueryRef.current.page,
        staffQueryRef.current.limit,
        staffQueryRef.current.search,
        staffQueryRef.current.active as ActiveFilter
      );
      api.setSuccess("Staff eliminado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando staff");
    } finally {
      api.setLoading(false);
    }
  }

  const resetStaffLoaded = () => setStaffLoaded(false);

  return {
    staff,
    staffTotal,
    staffLoaded,
    loadStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    resetStaffLoaded
  };
}
