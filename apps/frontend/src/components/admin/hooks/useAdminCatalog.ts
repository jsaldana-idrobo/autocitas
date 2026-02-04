import { useState, type FormEvent } from "react";
import { apiRequest } from "../../../lib/api";
import { ResourceItem, ServiceItem, StaffItem } from "../types";
import { AdminApiContext } from "./types";

export function useAdminCatalog(api: AdminApiContext) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  async function loadServices() {
    api.setLoading(true);
    api.resetError();
    try {
      const data = await apiRequest<ServiceItem[]>(`/admin/businesses/${api.businessId}/services`, api.authHeaders);
      setServices(data);
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error cargando servicios");
    } finally {
      api.setLoading(false);
    }
  }

  async function loadResources() {
    if (api.role === "staff") {
      return;
    }
    api.setLoading(true);
    api.resetError();
    try {
      const data = await apiRequest<ResourceItem[]>(`/admin/businesses/${api.businessId}/resources`, api.authHeaders);
      setResources(data);
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error cargando recursos");
    } finally {
      api.setLoading(false);
    }
  }

  async function loadStaff() {
    api.setLoading(true);
    api.resetError();
    try {
      const data = await apiRequest<StaffItem[]>(`/admin/businesses/${api.businessId}/staff`, api.authHeaders);
      setStaff(data);
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error cargando staff");
    } finally {
      api.setLoading(false);
    }
  }

  async function createService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
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
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/services`, {
        method: "POST",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      event.currentTarget.reset();
      await loadServices();
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando servicio");
    } finally {
      api.setLoading(false);
    }
  }

  async function updateService(serviceId: string, payload: Partial<ServiceItem>) {
    api.resetError();
    try {
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/services/${serviceId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      setEditingServiceId(null);
      await loadServices();
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando servicio");
    } finally {
      api.setLoading(false);
    }
  }

  async function createResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim()
    };
    if (!payload.name) {
      api.setError("Nombre es obligatorio.");
      return;
    }

    try {
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/resources`, {
        method: "POST",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      event.currentTarget.reset();
      await loadResources();
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando recurso");
    } finally {
      api.setLoading(false);
    }
  }

  async function updateResource(resourceId: string, payload: Partial<ResourceItem>) {
    api.resetError();
    try {
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/resources/${resourceId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      setEditingResourceId(null);
      await loadResources();
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando recurso");
    } finally {
      api.setLoading(false);
    }
  }

  async function deleteResource(resourceId: string) {
    if (!confirm("Deseas eliminar este recurso?")) {
      return;
    }
    api.resetError();
    try {
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/resources/${resourceId}`, {
        method: "DELETE",
        ...api.authHeaders
      });
      await loadResources();
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando recurso");
    } finally {
      api.setLoading(false);
    }
  }

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
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
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/staff`, {
        method: "POST",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      event.currentTarget.reset();
      await loadStaff();
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando staff");
    } finally {
      api.setLoading(false);
    }
  }

  async function updateStaff(staffId: string, payload: { resourceId?: string; password?: string; active?: boolean }) {
    api.resetError();
    try {
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/staff/${staffId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      setEditingStaffId(null);
      await loadStaff();
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando staff");
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

  return {
    services,
    resources,
    staff,
    editingServiceId,
    setEditingServiceId,
    editingResourceId,
    setEditingResourceId,
    editingStaffId,
    setEditingStaffId,
    loadServices,
    loadResources,
    loadStaff,
    createService,
    updateService,
    createResource,
    updateResource,
    deleteResource,
    createStaff,
    updateStaff,
    ensureResourcesLoaded,
    ensureServicesLoaded
  };
}
