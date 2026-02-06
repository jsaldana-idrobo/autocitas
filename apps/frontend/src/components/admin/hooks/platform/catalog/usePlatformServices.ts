import { useCallback, useRef, useState } from "react";
import { apiRequest } from "../../../../../lib/api";
import { PaginatedResponse, ServiceItem } from "../../../types";
import { AdminApiContext } from "../../types";
import { createPaginationParams, type PlatformLoadGuard } from "../utils";

type ActiveFilter = "" | "active" | "inactive";

type PlatformServicesState = {
  platformServices: ServiceItem[];
  platformServicesTotal: number;
  platformServicesLoaded: boolean;
};

type PlatformServicesActions = {
  loadPlatformServices: (options?: {
    page?: number;
    limit?: number;
    search?: string;
    active?: ActiveFilter;
    businessId?: string;
    minDuration?: string;
    maxDuration?: string;
    minPrice?: string;
    maxPrice?: string;
  }) => Promise<void>;
  createPlatformService: (
    businessId: string,
    payload: { name: string; durationMinutes: number; price?: number }
  ) => Promise<void>;
  updatePlatformService: (
    businessId: string,
    serviceId: string,
    payload: Partial<ServiceItem>
  ) => Promise<void>;
  deletePlatformService: (businessId: string, serviceId: string) => Promise<void>;
  resetPlatformServicesLoaded: () => void;
};

export function usePlatformServices(
  api: AdminApiContext,
  loadGuard: PlatformLoadGuard
): PlatformServicesState & PlatformServicesActions {
  const { startLoad, endLoad } = loadGuard;
  const [platformServices, setPlatformServices] = useState<ServiceItem[]>([]);
  const [platformServicesTotal, setPlatformServicesTotal] = useState(0);
  const [platformServicesLoaded, setPlatformServicesLoaded] = useState(false);
  const servicesQueryRef = useRef({
    page: 1,
    limit: 25,
    businessId: "",
    active: "",
    search: "",
    minDuration: "",
    maxDuration: "",
    minPrice: "",
    maxPrice: ""
  });

  const buildServicesQueryOptions = () => ({
    page: servicesQueryRef.current.page,
    limit: servicesQueryRef.current.limit,
    search: servicesQueryRef.current.search,
    active: servicesQueryRef.current.active as ActiveFilter,
    businessId: servicesQueryRef.current.businessId,
    minDuration: servicesQueryRef.current.minDuration,
    maxDuration: servicesQueryRef.current.maxDuration,
    minPrice: servicesQueryRef.current.minPrice,
    maxPrice: servicesQueryRef.current.maxPrice
  });

  const refreshPlatformServices = async () => loadPlatformServices(buildServicesQueryOptions());

  const loadPlatformServices = useCallback(
    async (
      options: {
        page?: number;
        limit?: number;
        search?: string;
        active?: ActiveFilter;
        businessId?: string;
        minDuration?: string;
        maxDuration?: string;
        minPrice?: string;
        maxPrice?: string;
      } = {}
    ) => {
      const {
        page = 1,
        limit = 25,
        search = "",
        active = "",
        businessId = "",
        minDuration = "",
        maxDuration = "",
        minPrice = "",
        maxPrice = ""
      } = options;
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        servicesQueryRef.current = {
          page,
          limit,
          search,
          active,
          businessId,
          minDuration,
          maxDuration,
          minPrice,
          maxPrice
        };
        const params = createPaginationParams(page, limit);
        if (search) params.set("search", search);
        if (active) params.set("active", active === "active" ? "true" : "false");
        if (businessId) params.set("businessId", businessId);
        if (minDuration) params.set("minDuration", minDuration);
        if (maxDuration) params.set("maxDuration", maxDuration);
        if (minPrice) params.set("minPrice", minPrice);
        if (maxPrice) params.set("maxPrice", maxPrice);
        const data = await apiRequest<PaginatedResponse<ServiceItem>>(
          `/admin/platform/services?${params.toString()}`,
          api.authHeaders
        );
        setPlatformServices(data.items);
        setPlatformServicesTotal(data.total);
        setPlatformServicesLoaded(true);
      } catch (err) {
        api.setError(err instanceof Error ? err.message : "Error cargando servicios globales");
      } finally {
        api.setLoading(false);
        endLoad();
      }
    },
    [api, endLoad, startLoad]
  );

  async function createPlatformService(
    businessId: string,
    payload: { name: string; durationMinutes: number; price?: number }
  ) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/services`, {
        method: "POST",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      await refreshPlatformServices();
      api.setSuccess("Servicio creado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando servicio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function updatePlatformService(
    businessId: string,
    serviceId: string,
    payload: Partial<ServiceItem>
  ) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/services/${serviceId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      await refreshPlatformServices();
      api.setSuccess("Servicio actualizado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando servicio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function deletePlatformService(businessId: string, serviceId: string) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/services/${serviceId}`, {
        method: "DELETE",
        ...api.authHeaders
      });
      await refreshPlatformServices();
      api.setSuccess("Servicio eliminado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando servicio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  const resetPlatformServicesLoaded = () => setPlatformServicesLoaded(false);

  return {
    platformServices,
    platformServicesTotal,
    platformServicesLoaded,
    loadPlatformServices,
    createPlatformService,
    updatePlatformService,
    deletePlatformService,
    resetPlatformServicesLoaded
  };
}
