import { useState, type FormEvent } from "react";
import { apiRequest } from "../../../lib/api";
import { AppointmentItem, BusinessProfile, StaffItem } from "../types";
import { AdminApiContext } from "./types";

export function useAdminPlatform(api: AdminApiContext) {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [ownerBusinessId, setOwnerBusinessId] = useState("");
  const [platformOwners, setPlatformOwners] = useState<StaffItem[]>([]);
  const [platformStaff, setPlatformStaff] = useState<StaffItem[]>([]);
  const [platformAppointments, setPlatformAppointments] = useState<AppointmentItem[]>([]);
  const [platformAppointmentsDate, setPlatformAppointmentsDate] = useState("");
  const [platformAppointmentsStatus, setPlatformAppointmentsStatus] = useState("");
  const [platformAppointmentsSearch, setPlatformAppointmentsSearch] = useState("");

  async function loadBusinesses() {
    api.setLoading(true);
    api.resetError();
    try {
      const data = await apiRequest<BusinessProfile[]>(
        "/admin/platform/businesses",
        api.authHeaders
      );
      setBusinesses(data);
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error cargando negocios");
    } finally {
      api.setLoading(false);
    }
  }

  async function loadPlatformOwners() {
    api.setLoading(true);
    api.resetError();
    try {
      const data = await apiRequest<StaffItem[]>(
        "/admin/platform/users?role=owner",
        api.authHeaders
      );
      setPlatformOwners(data);
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error cargando owners");
    } finally {
      api.setLoading(false);
    }
  }

  async function loadPlatformStaff() {
    api.setLoading(true);
    api.resetError();
    try {
      const data = await apiRequest<StaffItem[]>(
        "/admin/platform/users?role=staff",
        api.authHeaders
      );
      setPlatformStaff(data);
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error cargando staff");
    } finally {
      api.setLoading(false);
    }
  }

  async function loadPlatformAppointments(
    nextDate?: string,
    nextStatus?: string,
    nextSearch?: string
  ) {
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
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error cargando citas globales");
    } finally {
      api.setLoading(false);
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
    }
  }

  return {
    businesses,
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
    loadBusinesses,
    loadPlatformOwners,
    loadPlatformStaff,
    loadPlatformAppointments,
    createBusiness,
    createOwner
  };
}
