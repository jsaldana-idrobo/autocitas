import { useCallback, useRef, useState, type FormEvent } from "react";
import { apiRequest } from "../../../lib/api";
import { PaginatedResponse, ResourceItem, ServiceItem, StaffItem } from "../types";
import { AdminApiContext } from "./types";

export function useAdminCatalog(api: AdminApiContext) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [servicesTotal, setServicesTotal] = useState(0);
  const [resourcesTotal, setResourcesTotal] = useState(0);
  const [staffTotal, setStaffTotal] = useState(0);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  const [staffLoaded, setStaffLoaded] = useState(false);
  const isLoadingRef = useRef(false);
  const servicesQueryRef = useRef({ page: 1, limit: 25, search: "", active: "" });
  const resourcesQueryRef = useRef({ page: 1, limit: 25, search: "", active: "" });
  const staffQueryRef = useRef({ page: 1, limit: 25, search: "", active: "" });

  const startLoad = useCallback(() => {
    if (isLoadingRef.current) return false;
    isLoadingRef.current = true;
    return true;
  }, []);

  const endLoad = useCallback(() => {
    isLoadingRef.current = false;
  }, []);

  const loadServices = useCallback(
    async (page = 1, limit = 25, search = "", active: "" | "active" | "inactive" = "") => {
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        servicesQueryRef.current = { page, limit, search, active };
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (search) params.set("search", search);
        if (active) params.set("active", active === "active" ? "true" : "false");
        const data = await apiRequest<PaginatedResponse<ServiceItem>>(
          `/admin/businesses/${api.businessId}/services?${params.toString()}`,
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
    [api, endLoad, startLoad]
  );

  const loadResources = useCallback(
    async (page = 1, limit = 25, search = "", active: "" | "active" | "inactive" = "") => {
      if (api.role === "staff") {
        return;
      }
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        resourcesQueryRef.current = { page, limit, search, active };
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
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

  const loadStaff = useCallback(
    async (page = 1, limit = 25, search = "", active: "" | "active" | "inactive" = "") => {
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        staffQueryRef.current = { page, limit, search, active };
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
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

  async function createService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
    api.resetSuccess();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      durationMinutes: Number(form.get("durationMinutes")),
      price: form.get("price") ? Number(form.get("price")) : undefined
    };
    if (!payload.name || !payload.durationMinutes || payload.durationMinutes <= 0) {
      api.setError("Nombre y duracion son obligatorios.");
      return;
    }

    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/services`, {
        method: "POST",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      event.currentTarget.reset();
      await loadServices(
        servicesQueryRef.current.page,
        servicesQueryRef.current.limit,
        servicesQueryRef.current.search,
        servicesQueryRef.current.active as "" | "active" | "inactive"
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
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/services/${serviceId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      await loadServices(
        servicesQueryRef.current.page,
        servicesQueryRef.current.limit,
        servicesQueryRef.current.search,
        servicesQueryRef.current.active as "" | "active" | "inactive"
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
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/services/${serviceId}`, {
        method: "DELETE",
        ...api.authHeaders
      });
      await loadServices(
        servicesQueryRef.current.page,
        servicesQueryRef.current.limit,
        servicesQueryRef.current.search,
        servicesQueryRef.current.active as "" | "active" | "inactive"
      );
      api.setSuccess("Servicio eliminado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando servicio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function createResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
    api.resetSuccess();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim()
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
        resourcesQueryRef.current.active as "" | "active" | "inactive"
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
        resourcesQueryRef.current.active as "" | "active" | "inactive"
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
        resourcesQueryRef.current.active as "" | "active" | "inactive"
      );
      api.setSuccess("Recurso eliminado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando recurso");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
    api.resetSuccess();
    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get("email") || "").trim(),
      password: String(form.get("password") || "").trim(),
      resourceId: String(form.get("resourceId") || "").trim(),
      role: String(form.get("role") || "").trim()
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
        staffQueryRef.current.active as "" | "active" | "inactive"
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
        staffQueryRef.current.active as "" | "active" | "inactive"
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
        staffQueryRef.current.active as "" | "active" | "inactive"
      );
      api.setSuccess("Staff eliminado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando staff");
    } finally {
      api.setLoading(false);
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

  async function ensureServicesLoaded() {
    if (services.length === 0) {
      await loadServices();
    }
  }

  function resetLoaded() {
    setServicesLoaded(false);
    setResourcesLoaded(false);
    setStaffLoaded(false);
  }

  return {
    services,
    resources,
    staff,
    servicesTotal,
    resourcesTotal,
    staffTotal,
    servicesLoaded,
    resourcesLoaded,
    staffLoaded,
    loadServices,
    loadResources,
    loadStaff,
    createService,
    updateService,
    deleteService,
    createResource,
    updateResource,
    deleteResource,
    createStaff,
    updateStaff,
    deleteStaff,
    ensureResourcesLoaded,
    ensureServicesLoaded,
    resetLoaded
  };
}
