import { useCallback, useRef, useState, type FormEvent } from "react";
import { apiRequest } from "../../../../lib/api";
import { PaginatedResponse, ResourceItem } from "../../types";
import { AdminApiContext } from "../types";
import { createPaginationParams, readFormString, type CatalogLoadGuard } from "./utils";

type ActiveFilter = "" | "active" | "inactive";

type ResourcesState = {
  resources: ResourceItem[];
  resourcesTotal: number;
  resourcesLoaded: boolean;
};

type ResourcesActions = {
  loadResources: (
    page?: number,
    limit?: number,
    search?: string,
    active?: ActiveFilter
  ) => Promise<void>;
  createResource: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  updateResource: (resourceId: string, payload: Partial<ResourceItem>) => Promise<void>;
  deleteResource: (resourceId: string) => Promise<void>;
  ensureResourcesLoaded: () => Promise<void>;
  resetResourcesLoaded: () => void;
};

export function useAdminCatalogResources(
  api: AdminApiContext,
  loadGuard: CatalogLoadGuard
): ResourcesState & ResourcesActions {
  const { startLoad, endLoad } = loadGuard;
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [resourcesTotal, setResourcesTotal] = useState(0);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  const resourcesQueryRef = useRef({ page: 1, limit: 25, search: "", active: "" });

  const loadResources = useCallback(
    async (page = 1, limit = 25, search = "", active: ActiveFilter = "") => {
      if (api.role === "staff") {
        return;
      }
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        resourcesQueryRef.current = { page, limit, search, active };
        const params = createPaginationParams(page, limit);
        if (search) params.set("search", search);
        if (active) params.set("active", active === "active" ? "true" : "false");
        const data = await apiRequest<PaginatedResponse<ResourceItem>>(
          `/admin/businesses/${api.businessId}/resources?${params.toString()}`,
          api.authHeaders
        );
        setResources(data.items);
        setResourcesTotal(data.total);
        setResourcesLoaded(true);
      } catch (err) {
        api.setError(err instanceof Error ? err.message : "Error cargando recursos");
      } finally {
        api.setLoading(false);
        endLoad();
      }
    },
    [api, endLoad, startLoad]
  );

  async function createResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
    api.resetSuccess();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: readFormString(form, "name")
    };
    if (!payload.name) {
      api.setError("Nombre es obligatorio.");
      return;
    }

    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/resources`, {
        method: "POST",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      event.currentTarget.reset();
      await loadResources(
        resourcesQueryRef.current.page,
        resourcesQueryRef.current.limit,
        resourcesQueryRef.current.search,
        resourcesQueryRef.current.active as ActiveFilter
      );
      api.setSuccess("Recurso creado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando recurso");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function updateResource(resourceId: string, payload: Partial<ResourceItem>) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/resources/${resourceId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      await loadResources(
        resourcesQueryRef.current.page,
        resourcesQueryRef.current.limit,
        resourcesQueryRef.current.search,
        resourcesQueryRef.current.active as ActiveFilter
      );
      api.setSuccess("Recurso actualizado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando recurso");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function deleteResource(resourceId: string) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/resources/${resourceId}`, {
        method: "DELETE",
        ...api.authHeaders
      });
      await loadResources(
        resourcesQueryRef.current.page,
        resourcesQueryRef.current.limit,
        resourcesQueryRef.current.search,
        resourcesQueryRef.current.active as ActiveFilter
      );
      api.setSuccess("Recurso eliminado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando recurso");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function ensureResourcesLoaded() {
    if (api.role === "staff") {
      return;
    }
    if (resources.length === 0) {
      await loadResources();
    }
  }

  const resetResourcesLoaded = () => setResourcesLoaded(false);

  return {
    resources,
    resourcesTotal,
    resourcesLoaded,
    loadResources,
    createResource,
    updateResource,
    deleteResource,
    ensureResourcesLoaded,
    resetResourcesLoaded
  };
}
