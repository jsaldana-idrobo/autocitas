import React, { useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";
import { useAdminSession } from "./useAdminSession";

type TabKey =
  | "platform"
  | "business"
  | "services"
  | "resources"
  | "staff"
  | "blocks"
  | "hours"
  | "policies"
  | "appointments";

interface ServiceItem {
  _id: string;
  name: string;
  durationMinutes: number;
  price?: number;
  active: boolean;
  allowedResourceIds?: string[];
}

interface ResourceItem {
  _id: string;
  name: string;
  active: boolean;
}

interface StaffItem {
  _id: string;
  email: string;
  role: string;
  active: boolean;
  resourceId?: string;
}

interface BlockItem {
  _id: string;
  startTime: string;
  endTime: string;
  resourceId?: string;
  reason?: string;
}

interface BusinessHoursItem {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
}

interface Policies {
  cancellationHours: number;
  rescheduleLimit: number;
  allowSameDay: boolean;
}

interface AppointmentItem {
  _id: string;
  serviceId: string;
  resourceId?: string;
  customerName: string;
  customerPhone: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface BusinessProfile {
  _id?: string;
  name?: string;
  slug?: string;
  timezone?: string;
  contactPhone?: string;
  address?: string;
  status?: "active" | "inactive";
}

const tabConfig: { key: TabKey; label: string }[] = [
  { key: "platform", label: "Plataforma" },
  { key: "business", label: "Negocio" },
  { key: "services", label: "Servicios" },
  { key: "resources", label: "Recursos" },
  { key: "staff", label: "Staff" },
  { key: "blocks", label: "Bloqueos" },
  { key: "hours", label: "Horarios" },
  { key: "policies", label: "Politicas" },
  { key: "appointments", label: "Citas" }
];

const dayLabels = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const ownerTabs: TabKey[] = [
  "business",
  "services",
  "resources",
  "staff",
  "blocks",
  "hours",
  "policies",
  "appointments"
];

const staffTabs: TabKey[] = ["blocks", "appointments"];

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
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [ownerBusinessId, setOwnerBusinessId] = useState("");

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

  const availableTabs = role === "staff" ? staffTabs : role === "platform_admin" ? ["platform", ...ownerTabs] : ownerTabs;
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
      const business = await apiRequest<BusinessProfile & { hours: BusinessHoursItem[]; policies: Policies }>(
        `/admin/businesses/${businessId}`,
        authHeaders
      );
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

  async function loadAppointments() {
    setLoading(true);
    resetError();
    try {
      const params = new URLSearchParams();
      if (appointmentsDate) params.set("date", appointmentsDate);
      if (appointmentsStatus) params.set("status", appointmentsStatus);
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

  async function updateStaff(staffId: string, payload: { resourceId?: string; password?: string; active?: boolean }) {
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
    const payload = {
      startTime: String(form.get("startTime") || "").trim(),
      endTime: String(form.get("endTime") || "").trim(),
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
    try {
      setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/blocks/${blockId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
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
    const payloadHours = dayLabels.map((_, index) => ({
      dayOfWeek: index,
      openTime: String(form.get(`open-${index}`) || "").trim(),
      closeTime: String(form.get(`close-${index}`) || "").trim()
    }));

    try {
      setLoading(true);
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

  if (!isAuthed) {
    return (
      <div className="card mx-auto max-w-lg p-8">
        <h2 className="text-2xl font-semibold">Admin</h2>
        <p className="mt-2 text-sm text-slate-500">Ingresa con tu usuario admin.</p>
        {error && <p className="mt-4 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <InputField name="email" label="Email" type="email" />
          <InputField name="password" label="Password" type="password" />
          <InputField name="businessId" label="Business ID (opcional)" />
          <button
            type="submit"
            className="w-full rounded-xl bg-primary-600 px-4 py-2 text-white"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-2xl font-semibold">Panel admin</h2>
          <p className="text-sm text-slate-500">
            Business ID: {businessId || "sin seleccionar"} · Rol: {role}
          </p>
        </div>
        <button
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
          onClick={handleLogout}
        >
          Cerrar sesion
        </button>
      </header>

      <nav className="flex flex-wrap gap-2">
        {tabConfig
          .filter((tab) => availableTabs.includes(tab.key))
          .filter((tab) => (tab.key === "platform" ? role === "platform_admin" : true))
          .filter((tab) => (tab.key === "platform" ? true : canUseBusinessTabs))
          .map((tab) => (
            <button
              key={tab.key}
              className={`rounded-full px-4 py-2 text-sm ${
                activeTab === tab.key
                  ? "bg-primary-600 text-white"
                  : "bg-white/70 text-slate-700 shadow-sm"
              }`}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === "platform") void loadBusinesses();
                if (tab.key === "services") void loadServices();
                if (tab.key === "resources") void loadResources();
                if (tab.key === "staff") void Promise.all([loadStaff(), ensureResourcesLoaded()]);
                if (tab.key === "blocks") {
                  if (role === "staff") {
                    void loadBlocks();
                  } else {
                    void Promise.all([loadBlocks(), ensureResourcesLoaded()]);
                  }
                }
                if (tab.key === "business" || tab.key === "hours" || tab.key === "policies") {
                  void loadBusinessSettings();
                }
                if (tab.key === "appointments") {
                  if (role === "staff") {
                    void loadAppointments();
                  } else {
                    void Promise.all([loadAppointments(), ensureResourcesLoaded(), ensureServicesLoaded()]);
                  }
                }
              }}
            >
              {tab.label}
            </button>
          ))}
      </nav>

      {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      {activeTab === "platform" && role === "platform_admin" && (
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Negocios (Plataforma)</h3>
            <button className="text-xs text-slate-500" onClick={() => void loadBusinesses()}>
              Refrescar
            </button>
          </div>
          <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={createBusiness}>
            <InputField name="name" label="Nombre" />
            <InputField name="slug" label="Slug" />
            <InputField name="timezone" label="Zona horaria" />
            <InputField name="contactPhone" label="Telefono" />
            <InputField name="address" label="Direccion" />
            <label className="block text-sm font-medium">
              Estado
              <select
                name="status"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </label>
            <button className="rounded-xl bg-primary-600 px-4 py-2 text-white md:col-span-3" type="submit">
              Crear negocio
            </button>
          </form>
          <div className="mt-6 space-y-2">
            {businesses.map((business) => (
              <div key={business._id} className="card-muted flex flex-wrap items-center justify-between gap-3 p-3">
                <div>
                  <p className="font-medium">{business.name}</p>
                  <p className="text-xs text-slate-500">{business.slug}</p>
                </div>
                <button
                  className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                  onClick={() => {
                    const id = String(business._id || "");
                    selectBusiness(id);
                    setOwnerBusinessId(id);
                  }}
                >
                  Usar este negocio
                </button>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-slate-200/60 pt-6">
            <h4 className="text-base font-semibold">Crear owner</h4>
            <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={createOwner}>
              <label className="block text-sm font-medium">
                Business ID
                <input
                  name="businessId"
                  value={ownerBusinessId}
                  onChange={(event) => setOwnerBusinessId(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  required
                />
              </label>
              <InputField name="email" label="Email owner" type="email" />
              <InputField name="password" label="Password owner" type="password" />
              <button className="rounded-xl bg-primary-600 px-4 py-2 text-white md:col-span-3" type="submit">
                Crear owner
              </button>
            </form>
          </div>
        </section>
      )}

      {activeTab === "business" && role !== "staff" && (
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Perfil del negocio</h3>
            <button className="text-xs text-slate-500" onClick={() => void loadBusinessSettings()}>
              Refrescar
            </button>
          </div>
          <form
            key={`${businessProfile.name ?? ""}-${businessProfile.slug ?? ""}-${businessProfile.timezone ?? ""}`}
            className="mt-4 grid gap-4 md:grid-cols-2"
            onSubmit={saveBusinessProfile}
          >
            <InputField name="name" label="Nombre" defaultValue={businessProfile.name} />
            <InputField name="slug" label="Slug" defaultValue={businessProfile.slug} />
            <InputField name="timezone" label="Zona horaria" defaultValue={businessProfile.timezone} />
            <InputField name="contactPhone" label="Telefono" defaultValue={businessProfile.contactPhone} />
            <InputField name="address" label="Direccion" defaultValue={businessProfile.address} />
            <label className="block text-sm font-medium">
              Estado
              <select
                name="status"
                defaultValue={businessProfile.status || "active"}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </label>
            <button className="rounded-xl bg-primary-600 px-4 py-2 text-white md:col-span-2" type="submit">
              Guardar negocio
            </button>
          </form>
        </section>
      )}

      {activeTab === "services" && role !== "staff" && (
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Servicios</h3>
            <button className="text-xs text-slate-500" onClick={() => void loadServices()}>
              Refrescar
            </button>
          </div>
          <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={createService}>
            <InputField name="name" label="Nombre" placeholder="Corte clasico" />
            <InputField name="durationMinutes" label="Duracion (min)" type="number" />
            <InputField name="price" label="Precio" type="number" />
            <button className="rounded-xl bg-primary-600 px-4 py-2 text-white md:col-span-3" type="submit">
              Crear servicio
            </button>
          </form>
          <div className="mt-6 space-y-2">
            {services.map((service) => (
              <div key={service._id} className="card-muted p-3">
                {editingServiceId === service._id ? (
                  <ServiceEditor
                    item={service}
                    resources={resources}
                    onCancel={() => setEditingServiceId(null)}
                    onSave={(payload) => updateService(service._id, payload)}
                  />
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-slate-500">
                        {service.durationMinutes} min · {service.active ? "Activo" : "Inactivo"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">${service.price ?? "-"}</span>
                      <button
                        className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                        onClick={() => {
                          void ensureResourcesLoaded();
                          setEditingServiceId(service._id);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                        onClick={() => updateService(service._id, { active: !service.active })}
                      >
                        {service.active ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "resources" && role !== "staff" && (
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recursos</h3>
            <button className="text-xs text-slate-500" onClick={() => void loadResources()}>
              Refrescar
            </button>
          </div>
          <form className="mt-4 flex flex-wrap gap-3" onSubmit={createResource}>
            <InputField name="name" label="Nombre" className="flex-1" />
            <button className="rounded-xl bg-primary-600 px-4 py-2 text-white" type="submit">
              Crear recurso
            </button>
          </form>
          <div className="mt-6 space-y-2">
            {resources.map((resource) => (
              <div key={resource._id} className="card-muted p-3">
                {editingResourceId === resource._id ? (
                  <ResourceEditor
                    item={resource}
                    onCancel={() => setEditingResourceId(null)}
                    onSave={(payload) => updateResource(resource._id, payload)}
                  />
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{resource.name}</p>
                      <p className="text-xs text-slate-500">{resource.active ? "Activo" : "Inactivo"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                        onClick={() => setEditingResourceId(resource._id)}
                      >
                        Editar
                      </button>
                      <button
                        className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                        onClick={() => deleteResource(resource._id)}
                      >
                        Desactivar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "staff" && role !== "staff" && (
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Staff</h3>
            <button className="text-xs text-slate-500" onClick={() => void loadStaff()}>
              Refrescar
            </button>
          </div>
          <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={createStaff}>
            <InputField name="email" label="Email" type="email" />
            <InputField name="password" label="Password" type="password" />
            <label className="block text-sm font-medium">
              Recurso
              <select name="resourceId" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
                <option value="">Selecciona</option>
                {resources.map((resource) => (
                  <option key={resource._id} value={resource._id}>
                    {resource.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="rounded-xl bg-primary-600 px-4 py-2 text-white md:col-span-3" type="submit">
              Crear staff
            </button>
          </form>
          <div className="mt-6 space-y-2">
            {staff.map((member) => (
              <div key={member._id} className="card-muted p-3">
                {editingStaffId === member._id ? (
                  <StaffEditor
                    item={member}
                    resources={resources}
                    onCancel={() => setEditingStaffId(null)}
                    onSave={(payload) => updateStaff(member._id, payload)}
                  />
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{member.email}</p>
                      <p className="text-xs text-slate-500">
                        {member.active ? "Activo" : "Inactivo"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                        onClick={() => setEditingStaffId(member._id)}
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "blocks" && (
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Bloqueos</h3>
            <button className="text-xs text-slate-500" onClick={() => void loadBlocks()}>
              Refrescar
            </button>
          </div>
          <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={createBlock}>
            <InputField name="startTime" label="Inicio" placeholder="2026-02-10T09:00:00Z" />
            <InputField name="endTime" label="Fin" placeholder="2026-02-10T10:00:00Z" />
            {role === "staff" ? (
              <div className="card-muted flex items-center px-3 py-2 text-sm text-slate-500">
                Bloqueo asignado a tu recurso
                <input type="hidden" name="resourceId" value={resourceId ?? ""} />
              </div>
            ) : (
              <label className="block text-sm font-medium">
                Recurso
                <select name="resourceId" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
                  <option value="">Todos</option>
                  {resources.map((resource) => (
                    <option key={resource._id} value={resource._id}>
                      {resource.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <InputField name="reason" label="Motivo" placeholder="Cita personal" />
            <button className="rounded-xl bg-primary-600 px-4 py-2 text-white md:col-span-4" type="submit">
              Crear bloqueo
            </button>
          </form>
          <div className="mt-6 space-y-2">
            {blocks.map((block) => (
              <div key={block._id} className="card-muted p-3">
                {editingBlockId === block._id ? (
                  <BlockEditor
                    item={block}
                    resources={resources}
                    canEditResource={role !== "staff"}
                    onCancel={() => setEditingBlockId(null)}
                    onSave={(payload) => updateBlock(block._id, payload)}
                  />
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{block.reason || "Bloqueo"}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(block.startTime).toLocaleString()} - {new Date(block.endTime).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                        onClick={() => setEditingBlockId(block._id)}
                      >
                        Editar
                      </button>
                      <button
                        className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                        onClick={() => deleteBlock(block._id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "hours" && role !== "staff" && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold">Horarios</h3>
          <form
            key={hours.length ? hours.map((item) => `${item.dayOfWeek}:${item.openTime}:${item.closeTime}`).join("|") : "hours"}
            className="mt-4 space-y-3"
            onSubmit={saveHours}
          >
            {dayLabels.map((label, index) => {
              const current = hours.find((item) => item.dayOfWeek === index);
              return (
                <div key={label} className="grid grid-cols-3 gap-2">
                  <div className="self-center text-sm font-medium">{label}</div>
                  <input
                    name={`open-${index}`}
                    placeholder="09:00"
                    defaultValue={current?.openTime ?? ""}
                    className="rounded-xl border border-slate-200 px-3 py-2"
                  />
                  <input
                    name={`close-${index}`}
                    placeholder="18:00"
                    defaultValue={current?.closeTime ?? ""}
                    className="rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>
              );
            })}
            <button className="rounded-xl bg-primary-600 px-4 py-2 text-white" type="submit">
              Guardar horarios
            </button>
          </form>
        </section>
      )}

      {activeTab === "policies" && role !== "staff" && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold">Politicas</h3>
          <form
            key={policies ? JSON.stringify(policies) : "policies"}
            className="mt-4 space-y-4"
            onSubmit={savePolicies}
          >
            <InputField
              name="cancellationHours"
              label="Horas cancelacion"
              type="number"
              defaultValue={policies?.cancellationHours ?? 24}
            />
            <InputField
              name="rescheduleLimit"
              label="Limite reprogramacion"
              type="number"
              defaultValue={policies?.rescheduleLimit ?? 1}
            />
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                name="allowSameDay"
                type="checkbox"
                defaultChecked={policies?.allowSameDay ?? true}
              />
              Permitir mismo dia
            </label>
            <button className="rounded-xl bg-primary-600 px-4 py-2 text-white" type="submit">
              Guardar politicas
            </button>
          </form>
        </section>
      )}

      {activeTab === "appointments" && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold">Citas</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              type="date"
              value={appointmentsDate}
              onChange={(event) => setAppointmentsDate(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
            <select
              className="rounded-xl border border-slate-200 px-3 py-2"
              value={appointmentsStatus}
              onChange={(event) => setAppointmentsStatus(event.target.value)}
            >
              <option value="">Todos</option>
              <option value="booked">Reservadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
            <button
              className="rounded-xl bg-primary-600 px-4 py-2 text-white"
              onClick={() => void loadAppointments()}
            >
              Buscar
            </button>
          </div>
          <div className="mt-6 space-y-2">
            {appointments.map((item) => {
              const serviceName = services.find((service) => service._id === item.serviceId)?.name;
              const resourceName = resources.find((resource) => resource._id === item.resourceId)?.name;
              return (
                <div key={item._id} className="card-muted p-3">
                  <p className="font-medium">{item.customerName}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(item.startTime).toLocaleString()} - {new Date(item.endTime).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.customerPhone} · {item.status}
                    {serviceName ? ` · ${serviceName}` : ""}
                    {resourceName ? ` · ${resourceName}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => updateAppointmentStatus(item._id, "completed")}
                    >
                      Marcar completada
                    </button>
                    <button
                      className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => updateAppointmentStatus(item._id, "cancelled")}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {loading && <p className="text-sm text-slate-500">Cargando...</p>}
    </div>
  );
}

function InputField({
  name,
  label,
  type = "text",
  placeholder,
  defaultValue,
  className
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string | number;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium ${className ?? ""}`}>
      {label}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
      />
    </label>
  );
}

function ServiceEditor({
  item,
  resources,
  onCancel,
  onSave
}: {
  item: ServiceItem;
  resources: ResourceItem[];
  onCancel: () => void;
  onSave: (payload: Partial<ServiceItem>) => void;
}) {
  const [name, setName] = useState(item.name);
  const [durationMinutes, setDurationMinutes] = useState(item.durationMinutes);
  const [price, setPrice] = useState(item.price ?? 0);
  const [allowedResources, setAllowedResources] = useState<string[]>(item.allowedResourceIds ?? []);

  function toggleResource(resourceId: string) {
    setAllowedResources((prev) =>
      prev.includes(resourceId) ? prev.filter((id) => id !== resourceId) : [...prev, resourceId]
    );
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 md:grid-cols-4">
        <input
          className="rounded-xl border border-slate-200 px-3 py-2"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="rounded-xl border border-slate-200 px-3 py-2"
          type="number"
          value={durationMinutes}
          onChange={(event) => setDurationMinutes(Number(event.target.value))}
        />
        <input
          className="rounded-xl border border-slate-200 px-3 py-2"
          type="number"
          value={price}
          onChange={(event) => setPrice(Number(event.target.value))}
        />
        <div className="flex items-center gap-2">
          <button
            className="rounded-xl bg-primary-600 px-3 py-1 text-xs text-white"
            onClick={() => onSave({ name, durationMinutes, price, allowedResourceIds: allowedResources })}
          >
            Guardar
          </button>
          <button className="rounded-xl border border-slate-200 px-3 py-1 text-xs" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
      <div className="card-muted p-3">
        <p className="text-xs font-medium uppercase text-slate-500">Recursos permitidos</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {resources.map((resource) => (
            <label key={resource._id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allowedResources.includes(resource._id)}
                onChange={() => toggleResource(resource._id)}
              />
              {resource.name}
            </label>
          ))}
          {resources.length === 0 && <span className="text-xs text-slate-400">No hay recursos.</span>}
        </div>
      </div>
    </div>
  );
}

function ResourceEditor({
  item,
  onCancel,
  onSave
}: {
  item: ResourceItem;
  onCancel: () => void;
  onSave: (payload: Partial<ResourceItem>) => void;
}) {
  const [name, setName] = useState(item.name);
  const [active, setActive] = useState(item.active);

  return (
    <div className="grid gap-2 md:grid-cols-3">
      <input
        className="rounded-xl border border-slate-200 px-3 py-2"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
        Activo
      </label>
      <div className="flex items-center gap-2">
        <button
          className="rounded-xl bg-primary-600 px-3 py-1 text-xs text-white"
          onClick={() => onSave({ name, active })}
        >
          Guardar
        </button>
        <button className="rounded-xl border border-slate-200 px-3 py-1 text-xs" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function StaffEditor({
  item,
  resources,
  onCancel,
  onSave
}: {
  item: StaffItem;
  resources: ResourceItem[];
  onCancel: () => void;
  onSave: (payload: { resourceId?: string; password?: string; active?: boolean }) => void;
}) {
  const [staffResource, setStaffResource] = useState(item.resourceId ?? "");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(item.active);

  return (
    <div className="grid gap-2 md:grid-cols-4">
      <select
        className="rounded-xl border border-slate-200 px-3 py-2"
        value={staffResource}
        onChange={(event) => setStaffResource(event.target.value)}
      >
        <option value="">Sin recurso</option>
        {resources.map((resource) => (
          <option key={resource._id} value={resource._id}>
            {resource.name}
          </option>
        ))}
      </select>
      <input
        className="rounded-xl border border-slate-200 px-3 py-2"
        placeholder="Nuevo password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
        Activo
      </label>
      <div className="flex items-center gap-2">
        <button
          className="rounded-xl bg-primary-600 px-3 py-1 text-xs text-white"
          onClick={() =>
            onSave({
              resourceId: staffResource || undefined,
              password: password || undefined,
              active
            })
          }
        >
          Guardar
        </button>
        <button className="rounded-xl border border-slate-200 px-3 py-1 text-xs" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function BlockEditor({
  item,
  resources,
  canEditResource,
  onCancel,
  onSave
}: {
  item: BlockItem;
  resources: ResourceItem[];
  canEditResource: boolean;
  onCancel: () => void;
  onSave: (payload: Partial<BlockItem>) => void;
}) {
  const [startTime, setStartTime] = useState(item.startTime);
  const [endTime, setEndTime] = useState(item.endTime);
  const [reason, setReason] = useState(item.reason ?? "");
  const [resourceIdValue, setResourceIdValue] = useState(item.resourceId ?? "");

  return (
    <div className="grid gap-2 md:grid-cols-5">
      <input
        className="rounded-xl border border-slate-200 px-3 py-2"
        value={startTime}
        onChange={(event) => setStartTime(event.target.value)}
      />
      <input
        className="rounded-xl border border-slate-200 px-3 py-2"
        value={endTime}
        onChange={(event) => setEndTime(event.target.value)}
      />
      {canEditResource ? (
        <select
          className="rounded-xl border border-slate-200 px-3 py-2"
          value={resourceIdValue}
          onChange={(event) => setResourceIdValue(event.target.value)}
        >
          <option value="">Todos</option>
          {resources.map((resource) => (
            <option key={resource._id} value={resource._id}>
              {resource.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="card-muted flex items-center px-3 py-2 text-sm text-slate-500">Recurso asignado</div>
      )}
      <input
        className="rounded-xl border border-slate-200 px-3 py-2"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <div className="flex items-center gap-2">
        <button
          className="rounded-xl bg-primary-600 px-3 py-1 text-xs text-white"
          onClick={() =>
            onSave({
              startTime,
              endTime,
              reason,
              resourceId: canEditResource ? resourceIdValue || undefined : undefined
            })
          }
        >
          Guardar
        </button>
        <button className="rounded-xl border border-slate-200 px-3 py-1 text-xs" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
