import { useCallback, useRef, useState, type FormEvent } from "react";
import { apiRequest } from "../../../../lib/api";
import { PaginatedResponse, ServiceItem } from "../../types";
import { AdminApiContext } from "../types";
import { createPaginationParams, readFormString, type CatalogLoadGuard } from "./utils";

type ActiveFilter = "" | "active" | "inactive";

type ServicesState = {
  services: ServiceItem[];
  servicesTotal: number;
  servicesLoaded: boolean;
};

type ServicesActions = {
  loadServices: (
    page?: number,
    limit?: number,
    search?: string,
    active?: ActiveFilter
  ) => Promise<void>;
  createService: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  updateService: (serviceId: string, payload: Partial<ServiceItem>) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  ensureServicesLoaded: () => Promise<void>;
  resetServicesLoaded: () => void;
};

export function useAdminCatalogServices(
  api: AdminApiContext,
  loadGuard: CatalogLoadGuard
): ServicesState & ServicesActions {
  const { startLoad, endLoad } = loadGuard;
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [servicesTotal, setServicesTotal] = useState(0);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const servicesQueryRef = useRef({ page: 1, limit: 25, search: "", active: "" });

  const ensureBusinessId = useCallback(() => {
    if (api.businessId) {
      return api.businessId;
    }
    api.setError("Selecciona un negocio primero.");
    return "";
  }, [api]);

  const loadServices = useCallback(
    async (page = 1, limit = 25, search = "", active: ActiveFilter = "") => {
      const businessId = ensureBusinessId();
      if (!businessId) return;
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        servicesQueryRef.current = { page, limit, search, active };
        const params = createPaginationParams(page, limit);
        if (search) params.set("search", search);
        if (active) params.set("active", active === "active" ? "true" : "false");
        const data = await apiRequest<PaginatedResponse<ServiceItem>>(
          `/admin/businesses/${businessId}/services?${params.toString()}`,
          api.authHeaders
        );
        setServices(data.items);
        setServicesTotal(data.total);
        setServicesLoaded(true);
      } catch (err) {
        api.setError(err instanceof Error ? err.message : "Error cargando servicios");
      } finally {
        api.setLoading(false);
        endLoad();
      }
    },
    [api, endLoad, ensureBusinessId, startLoad]
  );

  async function createService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
    api.resetSuccess();
    const businessId = ensureBusinessId();
    if (!businessId) return;
    const form = new FormData(event.currentTarget);
    const durationValue = Number(readFormString(form, "durationMinutes"));
    const priceRaw = readFormString(form, "price");
    const priceValue = priceRaw ? Number(priceRaw) : undefined;
    const payload = {
      name: readFormString(form, "name"),
      durationMinutes: durationValue,
      price: priceValue
    };
    if (!payload.name || !payload.durationMinutes || payload.durationMinutes <= 0) {
      api.setError("Nombre y duracion son obligatorios.");
      return;
    }

    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/services`, {
        method: "POST",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      event.currentTarget.reset();
      await loadServices(
        servicesQueryRef.current.page,
        servicesQueryRef.current.limit,
        servicesQueryRef.current.search,
        servicesQueryRef.current.active as ActiveFilter
      );
      api.setSuccess("Servicio creado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando servicio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function updateService(serviceId: string, payload: Partial<ServiceItem>) {
    api.resetError();
    api.resetSuccess();
    const businessId = ensureBusinessId();
    if (!businessId) return;
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/services/${serviceId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      await loadServices(
        servicesQueryRef.current.page,
        servicesQueryRef.current.limit,
        servicesQueryRef.current.search,
        servicesQueryRef.current.active as ActiveFilter
      );
      api.setSuccess("Servicio actualizado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando servicio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function deleteService(serviceId: string) {
    api.resetError();
    api.resetSuccess();
    const businessId = ensureBusinessId();
    if (!businessId) return;
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/services/${serviceId}`, {
        method: "DELETE",
        ...api.authHeaders
      });
      await loadServices(
        servicesQueryRef.current.page,
        servicesQueryRef.current.limit,
        servicesQueryRef.current.search,
        servicesQueryRef.current.active as ActiveFilter
      );
      api.setSuccess("Servicio eliminado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando servicio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function ensureServicesLoaded() {
    if (services.length === 0) {
      await loadServices();
    }
  }

  const resetServicesLoaded = () => setServicesLoaded(false);

  return {
    services,
    servicesTotal,
    servicesLoaded,
    loadServices,
    createService,
    updateService,
    deleteService,
    ensureServicesLoaded,
    resetServicesLoaded
  };
}
