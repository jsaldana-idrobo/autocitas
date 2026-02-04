import React, { useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";
import { useAdminSession } from "./useAdminSession";
import {
  AppointmentItem,
  BlockItem,
  BusinessHoursItem,
  BusinessProfile,
  Policies,
  ResourceItem,
  ServiceItem,
  StaffItem,
  TabKey,
  ownerTabs,
  staffTabs
} from "./types";
import { getTodayValue, toIsoIfPossible } from "./utils";
import { AdminHeader } from "./components/AdminHeader";
import { AdminNav } from "./components/AdminNav";
import { AdminLogin } from "./components/AdminLogin";
import { PlatformSection } from "./sections/PlatformSection";
import { BusinessSection } from "./sections/BusinessSection";
import { ServicesSection } from "./sections/ServicesSection";
import { ResourcesSection } from "./sections/ResourcesSection";
import { StaffSection } from "./sections/StaffSection";
import { BlocksSection } from "./sections/BlocksSection";
import { HoursSection } from "./sections/HoursSection";
import { PoliciesSection } from "./sections/PoliciesSection";
import { AppointmentsSection } from "./sections/AppointmentsSection";
import { dayLabels } from "./types";

export function AdminApp() {
  const { token, businessId, role, resourceId, login, logout, selectBusiness } = useAdminSession();
  const [activeTab, setActiveTab] = useState<TabKey>("services");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [hours, setHours] = useState<BusinessHoursItem[]>([]);
  const [policies, setPolicies] = useState<Policies | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({});
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [appointmentsDate, setAppointmentsDate] = useState("");
  const [appointmentsStatus, setAppointmentsStatus] = useState("");
  const [appointmentsSearch, setAppointmentsSearch] = useState("");
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [ownerBusinessId, setOwnerBusinessId] = useState("");
  const [platformOwners, setPlatformOwners] = useState<StaffItem[]>([]);
  const [platformStaff, setPlatformStaff] = useState<StaffItem[]>([]);
  const [platformAppointments, setPlatformAppointments] = useState<AppointmentItem[]>([]);
  const [platformAppointmentsDate, setPlatformAppointmentsDate] = useState("");
  const [platformAppointmentsStatus, setPlatformAppointmentsStatus] = useState("");
  const [platformAppointmentsSearch, setPlatformAppointmentsSearch] = useState("");

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  React.useEffect(() => {
    if (role === "staff") {
      setActiveTab("appointments");
    }
    if (role === "platform_admin") {
      setActiveTab("platform");
    }
  }, [role]);

  const isAuthed = token.length > 0 && (role === "platform_admin" || businessId.length > 0);

  const resetError = () => setError(null);

  const authHeaders = useMemo(() => ({ token }), [token]);

  const availableTabs =
    role === "staff"
      ? staffTabs
      : role === "platform_admin"
        ? ["platform", ...ownerTabs]
        : ownerTabs;
  const canUseBusinessTabs = role !== "platform_admin" || businessId.length > 0;

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetError();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "").trim();
    const business = String(form.get("businessId") || "").trim();

    if (!email || !password) {
      setError("Completa email y password.");
      return;
    }

    try {
      setLoading(true);
      const payload = await login(email, password, business);
      if (payload.role === "staff") {
        setActiveTab("appointments");
      } else if (payload.role === "platform_admin") {
        setActiveTab("platform");
      } else {
        setActiveTab("services");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesion");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
  }

  async function loadServices() {
    setLoading(true);
    resetError();
    try {
      const data = await apiRequest<ServiceItem[]>(
        `/admin/businesses/${businessId}/services`,
        authHeaders
      );
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando servicios");
    } finally {
      setLoading(false);
    }
  }

  async function loadResources() {
    setLoading(true);
    resetError();
    try {
      const data = await apiRequest<ResourceItem[]>(
        `/admin/businesses/${businessId}/resources`,
        authHeaders
      );
      setResources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando recursos");
    } finally {
      setLoading(false);
    }
  }

  async function loadStaff() {
    setLoading(true);
    resetError();
    try {
      const data = await apiRequest<StaffItem[]>(
        `/admin/businesses/${businessId}/staff`,
        authHeaders
      );
      setStaff(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando staff");
    } finally {
      setLoading(false);
    }
  }

  async function loadBlocks() {
    setLoading(true);
    resetError();
    try {
      const data = await apiRequest<BlockItem[]>(
        `/admin/businesses/${businessId}/blocks`,
        authHeaders
      );
      setBlocks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando bloqueos");
    } finally {
      setLoading(false);
    }
  }

  async function loadBusinessSettings() {
    setLoading(true);
    resetError();
    try {
      const business = await apiRequest<
        BusinessProfile & { hours: BusinessHoursItem[]; policies: Policies }
      >(`/admin/businesses/${businessId}`, authHeaders);
      setHours(business.hours || []);
      setPolicies(business.policies || null);
      setBusinessProfile({
        _id: business._id,
        name: business.name,
        slug: business.slug,
        timezone: business.timezone,
        contactPhone: business.contactPhone,
        address: business.address,
        status: business.status
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando negocio");
    } finally {
      setLoading(false);
    }
  }

  async function loadAppointments(nextDate?: string, nextStatus?: string, nextSearch?: string) {
    setLoading(true);
    resetError();
    try {
      const params = new URLSearchParams();
      const dateValue = nextDate ?? appointmentsDate;
      const statusValue = nextStatus ?? appointmentsStatus;
      const searchValue = nextSearch ?? appointmentsSearch;
      if (dateValue) params.set("date", dateValue);
      if (statusValue) params.set("status", statusValue);
      if (searchValue) params.set("search", searchValue);
      const query = params.toString() ? `?${params.toString()}` : "";
      const data = await apiRequest<AppointmentItem[]>(
        `/admin/businesses/${businessId}/appointments${query}`,
        authHeaders
      );
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando citas");
    } finally {
      setLoading(false);
    }
  }

  async function loadBusinesses() {
    setLoading(true);
    resetError();
    try {
      const data = await apiRequest<BusinessProfile[]>("/admin/platform/businesses", authHeaders);
      setBusinesses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando negocios");
    } finally {
      setLoading(false);
    }
  }

  async function loadPlatformOwners() {
    setLoading(true);
    resetError();
    try {
      const data = await apiRequest<StaffItem[]>("/admin/platform/users?role=owner", authHeaders);
      setPlatformOwners(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando owners");
    } finally {
      setLoading(false);
    }
  }

  async function loadPlatformStaff() {
    setLoading(true);
    resetError();
    try {
      const data = await apiRequest<StaffItem[]>("/admin/platform/users?role=staff", authHeaders);
      setPlatformStaff(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando staff");
    } finally {
      setLoading(false);
    }
  }

  async function loadPlatformAppointments(nextDate?: string, nextStatus?: string, nextSearch?: string) {
    setLoading(true);
    resetError();
    try {
      const params = new URLSearchParams();
      const dateValue = nextDate ?? platformAppointmentsDate;
      const statusValue = nextStatus ?? platformAppointmentsStatus;
      const searchValue = nextSearch ?? platformAppointmentsSearch;
      if (dateValue) params.set("date", dateValue);
      if (statusValue) params.set("status", statusValue);
      if (searchValue) params.set("search", searchValue);
      const query = params.toString() ? `?${params.toString()}` : "";
      const data = await apiRequest<AppointmentItem[]>(`/admin/platform/appointments${query}`, authHeaders);
      setPlatformAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando citas globales");
    } finally {
      setLoading(false);
    }
  }

  async function createBusiness(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetError();
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
      setLoading(true);
      await apiRequest("/admin/platform/businesses", {
        method: "POST",
        body: JSON.stringify(payload),
        ...authHeaders
      });
      event.currentTarget.reset();
      await loadBusinesses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando negocio");
    } finally {
      setLoading(false);
    }
  }

  async function createOwner(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetError();
    const form = new FormData(event.currentTarget);
    const payload = {
      businessId: String(form.get("businessId") || "").trim(),
      email: String(form.get("email") || "").trim(),
      password: String(form.get("password") || "").trim()
    };

    try {
      setLoading(true);
      await apiRequest("/admin/platform/owners", {
        method: "POST",
        body: JSON.stringify(payload),
        ...authHeaders
      });
      event.currentTarget.reset();
      setOwnerBusinessId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando owner");
    } finally {
      setLoading(false);
    }
  }

  async function createService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetError();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      durationMinutes: Number(form.get("durationMinutes")),
      price: form.get("price") ? Number(form.get("price")) : undefined
    };
    if (!payload.name || !payload.durationMinutes || payload.durationMinutes <= 0) {
      setError("Nombre y duracion son obligatorios.");
      return;
    }

    try {
      setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/services`, {
        method: "POST",
        body: JSON.stringify(payload),
        ...authHeaders
      });
      event.currentTarget.reset();
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando servicio");
    } finally {
      setLoading(false);
    }
  }

  async function updateService(serviceId: string, payload: Partial<ServiceItem>) {
    resetError();
    try {
      setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/services/${serviceId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...authHeaders
      });
      setEditingServiceId(null);
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando servicio");
    } finally {
      setLoading(false);
    }
  }

  async function createResource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetError();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim()
    };
    if (!payload.name) {
      setError("El nombre del recurso es obligatorio.");
      return;
    }

    try {
      setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/resources`, {
        method: "POST",
        body: JSON.stringify(payload),
        ...authHeaders
      });
      event.currentTarget.reset();
      await loadResources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando recurso");
    } finally {
      setLoading(false);
    }
  }

  async function updateResource(resourceIdValue: string, payload: Partial<ResourceItem>) {
    resetError();
    try {
      setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/resources/${resourceIdValue}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...authHeaders
      });
      setEditingResourceId(null);
      await loadResources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando recurso");
    } finally {
      setLoading(false);
    }
  }

  async function deleteResource(resourceIdValue: string) {
    if (!confirm("Deseas desactivar este recurso?")) {
      return;
    }
    resetError();
    try {
      setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/resources/${resourceIdValue}`, {
        method: "DELETE",
        ...authHeaders
      });
      await loadResources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando recurso");
    } finally {
      setLoading(false);
    }
  }

  async function createStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetError();
    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get("email") || "").trim(),
      password: String(form.get("password") || "").trim(),
      resourceId: String(form.get("resourceId") || "").trim()
    };
    if (!payload.email || !payload.password || !payload.resourceId) {
      setError("Email, password y recurso son obligatorios.");
      return;
    }

    try {
      setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/staff`, {
        method: "POST",
        body: JSON.stringify(payload),
        ...authHeaders
      });
      event.currentTarget.reset();
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando staff");
    } finally {
      setLoading(false);
    }
  }

  async function updateStaff(
    staffId: string,
    payload: { resourceId?: string; password?: string; active?: boolean }
  ) {
    resetError();
    try {
      setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/staff/${staffId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...authHeaders
      });
      setEditingStaffId(null);
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando staff");
    } finally {
      setLoading(false);
    }
  }

  async function createBlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetError();
    const form = new FormData(event.currentTarget);
    const startRaw = String(form.get("startTime") || "").trim();
    const endRaw = String(form.get("endTime") || "").trim();
    const payload = {
      startTime: toIsoIfPossible(startRaw),
      endTime: toIsoIfPossible(endRaw),
      resourceId: String(form.get("resourceId") || "").trim() || undefined,
      reason: String(form.get("reason") || "").trim() || undefined
    };
    if (role === "staff" && resourceId) {
      payload.resourceId = resourceId;
    }

    try {
      setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/blocks`, {
        method: "POST",
        body: JSON.stringify(payload),
        ...authHeaders
      });
      event.currentTarget.reset();
      await loadBlocks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando bloqueo");
    } finally {
      setLoading(false);
    }
  }

  async function updateBlock(blockId: string, payload: Partial<BlockItem>) {
    resetError();
    const payloadToSend = {
      ...payload,
      startTime: payload.startTime ? toIsoIfPossible(payload.startTime) : undefined,
      endTime: payload.endTime ? toIsoIfPossible(payload.endTime) : undefined
    };
    try {
      setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/blocks/${blockId}`, {
        method: "PATCH",
        body: JSON.stringify(payloadToSend),
        ...authHeaders
      });
      setEditingBlockId(null);
      await loadBlocks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando bloqueo");
    } finally {
      setLoading(false);
    }
  }

  async function updateAppointmentStatus(appointmentId: string, status: string) {
    resetError();
    try {
      setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/appointments/${appointmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        ...authHeaders
      });
      await loadAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando cita");
    } finally {
      setLoading(false);
    }
  }

  async function deleteBlock(blockId: string) {
    if (!confirm("Deseas eliminar este bloqueo?")) {
      return;
    }
    resetError();
    try {
      setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/blocks/${blockId}`, {
        method: "DELETE",
        ...authHeaders
      });
      await loadBlocks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando bloqueo");
    } finally {
      setLoading(false);
    }
  }

  async function saveHours(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetError();
    const form = new FormData(event.currentTarget);
    let payloadHours: { dayOfWeek: number; openTime: string; closeTime: string }[] = [];
    try {
      payloadHours = dayLabels
        .map((_, index) => {
          const openTime = String(form.get(`open-${index}`) || "").trim();
          const closeTime = String(form.get(`close-${index}`) || "").trim();
          if (!openTime && !closeTime) {
            return null;
          }
          if (!openTime || !closeTime) {
            throw new Error(`Completa horario de ${dayLabels[index]}.`);
          }
          return { dayOfWeek: index, openTime, closeTime };
        })
        .filter(
          (item): item is { dayOfWeek: number; openTime: string; closeTime: string } =>
            item !== null
        );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error validando horarios");
      return;
    }

    try {
      setLoading(true);
      if (payloadHours.length === 0) {
        throw new Error("Define al menos un horario.");
      }
      await apiRequest(`/admin/businesses/${businessId}/hours`, {
        method: "PATCH",
        body: JSON.stringify({ hours: payloadHours }),
        ...authHeaders
      });
      await loadBusinessSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando horarios");
    } finally {
      setLoading(false);
    }
  }

  async function savePolicies(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetError();
    const form = new FormData(event.currentTarget);
    const payload = {
      cancellationHours: Number(form.get("cancellationHours")),
      rescheduleLimit: Number(form.get("rescheduleLimit")),
      allowSameDay: form.get("allowSameDay") === "on"
    };

    try {
      setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/policies`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...authHeaders
      });
      await loadBusinessSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando politicas");
    } finally {
      setLoading(false);
    }
  }

  async function saveBusinessProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetError();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim() || undefined,
      slug: String(form.get("slug") || "").trim() || undefined,
      timezone: String(form.get("timezone") || "").trim() || undefined,
      contactPhone: String(form.get("contactPhone") || "").trim() || undefined,
      address: String(form.get("address") || "").trim() || undefined,
      status: (String(form.get("status") || "").trim() as "active" | "inactive") || undefined
    };

    try {
      setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...authHeaders
      });
      await loadBusinessSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando negocio");
    } finally {
      setLoading(false);
    }
  }

  async function ensureResourcesLoaded() {
    if (resources.length === 0) {
      await loadResources();
    }
  }

  async function ensureServicesLoaded() {
    if (services.length === 0) {
      await loadServices();
    }
  }

  async function onPlatformTab() {
    await Promise.all([loadBusinesses(), loadPlatformOwners(), loadPlatformStaff()]);
    const nextDate = platformAppointmentsDate || getTodayValue();
    if (!platformAppointmentsDate) {
      setPlatformAppointmentsDate(nextDate);
    }
    await loadPlatformAppointments(nextDate, platformAppointmentsStatus, platformAppointmentsSearch);
  }

  async function onBlocksTab() {
    if (role === "staff") {
      await loadBlocks();
      return;
    }
    await Promise.all([loadBlocks(), ensureResourcesLoaded()]);
  }

  async function onAppointmentsTab() {
    const nextDate = appointmentsDate || getTodayValue();
    if (!appointmentsDate) {
      setAppointmentsDate(nextDate);
    }
    if (role === "staff") {
      await loadAppointments(nextDate, appointmentsStatus, appointmentsSearch);
      return;
    }
    await Promise.all([
      loadAppointments(nextDate, appointmentsStatus, appointmentsSearch),
      ensureResourcesLoaded(),
      ensureServicesLoaded()
    ]);
  }

  function handleTabSelect(tab: TabKey) {
    setActiveTab(tab);
    if (tab === "platform") {
      void onPlatformTab();
      return;
    }
    if (tab === "services") {
      void loadServices();
      return;
    }
    if (tab === "resources") {
      void loadResources();
      return;
    }
    if (tab === "staff") {
      void Promise.all([loadStaff(), ensureResourcesLoaded()]);
      return;
    }
    if (tab === "blocks") {
      void onBlocksTab();
      return;
    }
    if (tab === "business" || tab === "hours" || tab === "policies") {
      void loadBusinessSettings();
      return;
    }
    if (tab === "appointments") {
      void onAppointmentsTab();
    }
  }

  if (!isAuthed) {
    return <AdminLogin error={error} loading={loading} onLogin={handleLogin} />;
  }

  return (
    <div className="space-y-6">
      <AdminHeader businessId={businessId} role={role} onLogout={handleLogout} />

      <AdminNav
        activeTab={activeTab}
        availableTabs={availableTabs}
        canUseBusinessTabs={canUseBusinessTabs}
        onSelectTab={handleTabSelect}
      />

      {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      {activeTab === "platform" && role === "platform_admin" && (
        <PlatformSection
          businesses={businesses}
          ownerBusinessId={ownerBusinessId}
          setOwnerBusinessId={setOwnerBusinessId}
          loadBusinesses={loadBusinesses}
          createBusiness={createBusiness}
          createOwner={createOwner}
          onSelectBusiness={(id) => {
            selectBusiness(id);
            setOwnerBusinessId(id);
          }}
          owners={platformOwners}
          staff={platformStaff}
          appointments={platformAppointments}
          appointmentsDate={platformAppointmentsDate}
          setAppointmentsDate={setPlatformAppointmentsDate}
          appointmentsStatus={platformAppointmentsStatus}
          setAppointmentsStatus={setPlatformAppointmentsStatus}
          appointmentsSearch={platformAppointmentsSearch}
          setAppointmentsSearch={setPlatformAppointmentsSearch}
          loadOwners={loadPlatformOwners}
          loadStaff={loadPlatformStaff}
          loadAppointments={() => loadPlatformAppointments()}
        />
      )}

      {activeTab === "business" && role !== "staff" && (
        <BusinessSection
          businessProfile={businessProfile}
          loadBusinessSettings={loadBusinessSettings}
          saveBusinessProfile={saveBusinessProfile}
        />
      )}

      {activeTab === "services" && role !== "staff" && (
        <ServicesSection
          services={services}
          resources={resources}
          editingServiceId={editingServiceId}
          setEditingServiceId={setEditingServiceId}
          createService={createService}
          updateService={updateService}
          loadServices={loadServices}
          ensureResourcesLoaded={ensureResourcesLoaded}
        />
      )}

      {activeTab === "resources" && role !== "staff" && (
        <ResourcesSection
          resources={resources}
          editingResourceId={editingResourceId}
          setEditingResourceId={setEditingResourceId}
          createResource={createResource}
          updateResource={updateResource}
          deleteResource={deleteResource}
          loadResources={loadResources}
        />
      )}

      {activeTab === "staff" && role !== "staff" && (
        <StaffSection
          staff={staff}
          resources={resources}
          editingStaffId={editingStaffId}
          setEditingStaffId={setEditingStaffId}
          createStaff={createStaff}
          updateStaff={updateStaff}
          loadStaff={loadStaff}
        />
      )}

      {activeTab === "blocks" && (
        <BlocksSection
          blocks={blocks}
          resources={resources}
          role={role}
          resourceId={resourceId}
          editingBlockId={editingBlockId}
          setEditingBlockId={setEditingBlockId}
          createBlock={createBlock}
          updateBlock={updateBlock}
          deleteBlock={deleteBlock}
          loadBlocks={loadBlocks}
        />
      )}

      {activeTab === "hours" && role !== "staff" && (
        <HoursSection hours={hours} saveHours={saveHours} />
      )}

      {activeTab === "policies" && role !== "staff" && (
        <PoliciesSection policies={policies} savePolicies={savePolicies} />
      )}

      {activeTab === "appointments" && (
        <AppointmentsSection
          appointments={appointments}
          services={services}
          resources={resources}
          appointmentsDate={appointmentsDate}
          setAppointmentsDate={setAppointmentsDate}
          appointmentsStatus={appointmentsStatus}
          setAppointmentsStatus={setAppointmentsStatus}
          appointmentsSearch={appointmentsSearch}
          setAppointmentsSearch={setAppointmentsSearch}
          loadAppointments={() => loadAppointments()}
          updateAppointmentStatus={updateAppointmentStatus}
        />
      )}

      {loading && <p className="text-sm text-slate-500">Cargando...</p>}
    </div>
  );
}
