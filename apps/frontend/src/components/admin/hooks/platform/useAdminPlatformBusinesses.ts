import { useCallback, useRef, useState, type FormEvent } from "react";
import { apiRequest } from "../../../../lib/api";
import { BusinessHoursItem, BusinessProfile, PaginatedResponse, Policies } from "../../types";
import { AdminApiContext } from "../types";
import { createPaginationParams, readFormString } from "../shared/utils";
import type { PlatformLoadGuard } from "./utils";

type StatusFilter = "" | "active" | "inactive";

type BusinessesState = {
  businesses: BusinessProfile[];
  businessesTotal: number;
  businessesLoaded: boolean;
};

type BusinessesActions = {
  loadBusinesses: (
    page?: number,
    limit?: number,
    search?: string,
    status?: StatusFilter
  ) => Promise<void>;
  createBusiness: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  updateBusiness: (businessId: string, payload: Partial<BusinessProfile>) => Promise<void>;
  deleteBusiness: (businessId: string) => Promise<void>;
  savePlatformHours: (businessId: string, payloadHours: BusinessHoursItem[]) => Promise<void>;
  savePlatformPolicies: (businessId: string, payload: Policies) => Promise<void>;
  resetBusinessesLoaded: () => void;
};

export function useAdminPlatformBusinesses(
  api: AdminApiContext,
  loadGuard: PlatformLoadGuard
): BusinessesState & BusinessesActions {
  const { startLoad, endLoad } = loadGuard;
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [businessesTotal, setBusinessesTotal] = useState(0);
  const [businessesLoaded, setBusinessesLoaded] = useState(false);
  const businessesQueryRef = useRef({ page: 1, limit: 25, search: "", status: "" });

  const refreshBusinesses = async () =>
    loadBusinesses(
      businessesQueryRef.current.page,
      businessesQueryRef.current.limit,
      businessesQueryRef.current.search,
      businessesQueryRef.current.status as StatusFilter
    );

  const loadBusinesses = useCallback(
    async (page = 1, limit = 25, search = "", status: StatusFilter = "") => {
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        businessesQueryRef.current = { page, limit, search, status };
        const params = createPaginationParams(page, limit);
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        const data = await apiRequest<PaginatedResponse<BusinessProfile>>(
          `/admin/platform/businesses?${params.toString()}`,
          api.authHeaders
        );
        setBusinesses(data.items);
        setBusinessesTotal(data.total);
        setBusinessesLoaded(true);
      } catch (err) {
        api.setError(err instanceof Error ? err.message : "Error cargando negocios");
      } finally {
        api.setLoading(false);
        endLoad();
      }
    },
    [api, endLoad, startLoad]
  );

  async function createBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
    api.resetSuccess();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: readFormString(form, "name"),
      slug: readFormString(form, "slug"),
      timezone: readFormString(form, "timezone") || undefined,
      contactPhone: readFormString(form, "contactPhone") || undefined,
      address: readFormString(form, "address") || undefined,
      status: (readFormString(form, "status") as StatusFilter) || undefined
    };

    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest("/admin/platform/businesses", {
        method: "POST",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      event.currentTarget.reset();
      await refreshBusinesses();
      api.setSuccess("Negocio creado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando negocio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function updateBusiness(businessId: string, payload: Partial<BusinessProfile>) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/platform/businesses/${businessId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      await refreshBusinesses();
      api.setSuccess("Negocio actualizado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando negocio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function deleteBusiness(businessId: string) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/platform/businesses/${businessId}`, {
        method: "DELETE",
        ...api.authHeaders
      });
      await refreshBusinesses();
      api.setSuccess("Negocio eliminado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando negocio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function savePlatformHours(businessId: string, payloadHours: BusinessHoursItem[]) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/hours`, {
        method: "PATCH",
        body: JSON.stringify({ hours: payloadHours }),
        ...api.authHeaders
      });
      await refreshBusinesses();
      api.setSuccess("Horarios actualizados.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error guardando horarios");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function savePlatformPolicies(businessId: string, payload: Policies) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/policies`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      await refreshBusinesses();
      api.setSuccess("Politicas actualizadas.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error guardando politicas");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  const resetBusinessesLoaded = () => setBusinessesLoaded(false);

  return {
    businesses,
    businessesTotal,
    businessesLoaded,
    loadBusinesses,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    savePlatformHours,
    savePlatformPolicies,
    resetBusinessesLoaded
  };
}
