import { useRef, useState, type FormEvent } from "react";
import { apiRequest } from "../../../lib/api";
import { AppointmentItem, BusinessProfile, PlatformUserUpdate, StaffItem } from "../types";
import { AdminApiContext } from "./types";

export function useAdminPlatform(api: AdminApiContext) {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [businessesLoaded, setBusinessesLoaded] = useState(false);
  const [ownerBusinessId, setOwnerBusinessId] = useState("");
  const [platformOwners, setPlatformOwners] = useState<StaffItem[]>([]);
  const [platformStaff, setPlatformStaff] = useState<StaffItem[]>([]);
  const [platformAppointments, setPlatformAppointments] = useState<AppointmentItem[]>([]);
  const [platformAppointmentsDate, setPlatformAppointmentsDate] = useState("");
  const [platformAppointmentsStatus, setPlatformAppointmentsStatus] = useState("");
  const [platformAppointmentsSearch, setPlatformAppointmentsSearch] = useState("");
  const [platformOwnersLoaded, setPlatformOwnersLoaded] = useState(false);
  const [platformStaffLoaded, setPlatformStaffLoaded] = useState(false);
  const [platformAppointmentsLoaded, setPlatformAppointmentsLoaded] = useState(false);
  const isLoadingRef = useRef(false);

  function startLoad() {
    if (isLoadingRef.current) return false;
    isLoadingRef.current = true;
    return true;
  }

  function endLoad() {
    isLoadingRef.current = false;
  }

  async function loadBusinesses() {
    if (!startLoad()) return;
    api.setLoading(true);
    api.resetError();
    try {
      const data = await apiRequest<BusinessProfile[]>(
        "/admin/platform/businesses",
        api.authHeaders
      );
      setBusinesses(data);
      setBusinessesLoaded(true);
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error cargando negocios");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function loadPlatformOwners() {
    if (!startLoad()) return;
    api.setLoading(true);
    api.resetError();
    try {
      const data = await apiRequest<StaffItem[]>(
        "/admin/platform/users?role=owner",
        api.authHeaders
      );
      setPlatformOwners(data);
      setPlatformOwnersLoaded(true);
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error cargando owners");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function loadPlatformStaff() {
    if (!startLoad()) return;
    api.setLoading(true);
    api.resetError();
    try {
      const data = await apiRequest<StaffItem[]>(
        "/admin/platform/users?role=staff",
        api.authHeaders
      );
      setPlatformStaff(data);
      setPlatformStaffLoaded(true);
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error cargando staff");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function loadPlatformAppointments(
    nextDate?: string,
    nextStatus?: string,
    nextSearch?: string
  ) {
    if (!startLoad()) return;
    api.setLoading(true);
    api.resetError();
    try {
      const params = new URLSearchParams();
      const dateValue = nextDate ?? platformAppointmentsDate;
      const statusValue = nextStatus ?? platformAppointmentsStatus;
      const searchValue = nextSearch ?? platformAppointmentsSearch;
      if (dateValue) params.set("date", dateValue);
      if (statusValue) params.set("status", statusValue);
      if (searchValue) params.set("search", searchValue);
      const query = params.toString() ? `?${params.toString()}` : "";
      const data = await apiRequest<AppointmentItem[]>(
        `/admin/platform/appointments${query}`,
        api.authHeaders
      );
      setPlatformAppointments(data);
      setPlatformAppointmentsLoaded(true);
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error cargando citas globales");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function createBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      slug: String(form.get("slug") || "").trim(),
      timezone: String(form.get("timezone") || "").trim() || undefined,
      contactPhone: String(form.get("contactPhone") || "").trim() || undefined,
      address: String(form.get("address") || "").trim() || undefined,
      status: (String(form.get("status") || "").trim() as "active" | "inactive") || undefined
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
      await loadBusinesses();
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando negocio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function createOwner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
    const form = new FormData(event.currentTarget);
    const payload = {
      businessId: String(form.get("businessId") || "").trim(),
      email: String(form.get("email") || "").trim(),
      password: String(form.get("password") || "").trim()
    };

    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest("/admin/platform/owners", {
        method: "POST",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      event.currentTarget.reset();
      setOwnerBusinessId("");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando owner");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function updateBusiness(businessId: string, payload: Partial<BusinessProfile>) {
    api.resetError();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/platform/businesses/${businessId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      setBusinessesLoaded(false);
      await loadBusinesses();
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando negocio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function deleteBusiness(businessId: string) {
    if (!confirm("Deseas eliminar este negocio?")) {
      return;
    }
    api.resetError();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/platform/businesses/${businessId}`, {
        method: "DELETE",
        ...api.authHeaders
      });
      setBusinessesLoaded(false);
      await loadBusinesses();
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando negocio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  function resetLoaded() {
    setBusinessesLoaded(false);
    setPlatformOwnersLoaded(false);
    setPlatformStaffLoaded(false);
    setPlatformAppointmentsLoaded(false);
  }

  async function updatePlatformUser(userId: string, payload: PlatformUserUpdate) {
    api.resetError();
    try {
      api.setLoading(true);
      await apiRequest(`/admin/platform/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      setPlatformOwnersLoaded(false);
      setPlatformStaffLoaded(false);
      await Promise.all([loadPlatformOwners(), loadPlatformStaff()]);
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando usuario");
    } finally {
      api.setLoading(false);
    }
  }

  async function deletePlatformUser(userId: string) {
    if (!confirm("Deseas eliminar este usuario?")) {
      return;
    }
    api.resetError();
    try {
      api.setLoading(true);
      await apiRequest(`/admin/platform/users/${userId}`, {
        method: "DELETE",
        ...api.authHeaders
      });
      setPlatformOwnersLoaded(false);
      setPlatformStaffLoaded(false);
      await Promise.all([loadPlatformOwners(), loadPlatformStaff()]);
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando usuario");
    } finally {
      api.setLoading(false);
    }
  }

  return {
    businesses,
    businessesLoaded,
    ownerBusinessId,
    setOwnerBusinessId,
    platformOwners,
    platformStaff,
    platformAppointments,
    platformAppointmentsDate,
    setPlatformAppointmentsDate,
    platformAppointmentsStatus,
    setPlatformAppointmentsStatus,
    platformAppointmentsSearch,
    setPlatformAppointmentsSearch,
    platformOwnersLoaded,
    platformStaffLoaded,
    platformAppointmentsLoaded,
    loadBusinesses,
    loadPlatformOwners,
    loadPlatformStaff,
    loadPlatformAppointments,
    createBusiness,
    createOwner,
    updateBusiness,
    deleteBusiness,
    updatePlatformUser,
    deletePlatformUser,
    resetLoaded
  };
}
