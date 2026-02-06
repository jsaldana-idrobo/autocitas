import { useCallback, useRef, useState } from "react";
import { apiRequest } from "../../../../../lib/api";
import { PaginatedResponse, ResourceItem } from "../../../types";
import { AdminApiContext } from "../../types";
import { createPaginationParams, type PlatformLoadGuard } from "../utils";

type ActiveFilter = "" | "active" | "inactive";

type PlatformResourcesState = {
  platformResources: ResourceItem[];
  platformResourcesTotal: number;
  platformResourcesLoaded: boolean;
};

type PlatformResourcesActions = {
  loadPlatformResources: (
    page?: number,
    limit?: number,
    search?: string,
    active?: ActiveFilter,
    businessId?: string
  ) => Promise<void>;
  createPlatformResource: (businessId: string, payload: { name: string }) => Promise<void>;
  updatePlatformResource: (
    businessId: string,
    resourceId: string,
    payload: Partial<ResourceItem>
  ) => Promise<void>;
  deletePlatformResource: (businessId: string, resourceId: string) => Promise<void>;
  resetPlatformResourcesLoaded: () => void;
};

export function usePlatformResources(
  api: AdminApiContext,
  loadGuard: PlatformLoadGuard
): PlatformResourcesState & PlatformResourcesActions {
  const { startLoad, endLoad } = loadGuard;
  const [platformResources, setPlatformResources] = useState<ResourceItem[]>([]);
  const [platformResourcesTotal, setPlatformResourcesTotal] = useState(0);
  const [platformResourcesLoaded, setPlatformResourcesLoaded] = useState(false);
  const resourcesQueryRef = useRef({ page: 1, limit: 25, businessId: "", active: "", search: "" });

  const buildResourcesQueryParams = () => ({
    page: resourcesQueryRef.current.page,
    limit: resourcesQueryRef.current.limit,
    search: resourcesQueryRef.current.search,
    active: resourcesQueryRef.current.active as ActiveFilter,
    businessId: resourcesQueryRef.current.businessId
  });

  const refreshPlatformResources = async () => {
    const options = buildResourcesQueryParams();
    await loadPlatformResources(
      options.page,
      options.limit,
      options.search,
      options.active,
      options.businessId
    );
  };

  const loadPlatformResources = useCallback(
    async (page = 1, limit = 25, search = "", active: ActiveFilter = "", businessId = "") => {
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        resourcesQueryRef.current = { page, limit, search, active, businessId };
        const params = createPaginationParams(page, limit);
        if (search) params.set("search", search);
        if (active) params.set("active", active === "active" ? "true" : "false");
        if (businessId) params.set("businessId", businessId);
        const data = await apiRequest<PaginatedResponse<ResourceItem>>(
          `/admin/platform/resources?${params.toString()}`,
          api.authHeaders
        );
        setPlatformResources(data.items);
        setPlatformResourcesTotal(data.total);
        setPlatformResourcesLoaded(true);
      } catch (err) {
        api.setError(err instanceof Error ? err.message : "Error cargando recursos globales");
      } finally {
        api.setLoading(false);
        endLoad();
      }
    },
    [api, endLoad, startLoad]
  );

  async function createPlatformResource(businessId: string, payload: { name: string }) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/resources`, {
        method: "POST",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      await refreshPlatformResources();
      api.setSuccess("Recurso creado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando recurso");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function updatePlatformResource(
    businessId: string,
    resourceId: string,
    payload: Partial<ResourceItem>
  ) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/resources/${resourceId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      await refreshPlatformResources();
      api.setSuccess("Recurso actualizado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando recurso");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function deletePlatformResource(businessId: string, resourceId: string) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/resources/${resourceId}`, {
        method: "DELETE",
        ...api.authHeaders
      });
      await refreshPlatformResources();
      api.setSuccess("Recurso eliminado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando recurso");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  const resetPlatformResourcesLoaded = () => setPlatformResourcesLoaded(false);

  return {
    platformResources,
    platformResourcesTotal,
    platformResourcesLoaded,
    loadPlatformResources,
    createPlatformResource,
    updatePlatformResource,
    deletePlatformResource,
    resetPlatformResourcesLoaded
  };
}
