import React, { useMemo, useState } from "react";
import { AdminHeader } from "./components/AdminHeader";
import { AdminLogin } from "./components/AdminLogin";
import { AdminSidebar } from "./components/AdminSidebar";
import { AppointmentsSection } from "./sections/appointments/AppointmentsSection";
import { BlocksSection } from "./sections/blocks/BlocksSection";
import { BusinessSection } from "./sections/business/BusinessSection";
import { HoursSection } from "./sections/hours/HoursSection";
import { PlatformSection } from "./sections/platform/PlatformSection";
import { PoliciesSection } from "./sections/policies/PoliciesSection";
import { ResourcesSection } from "./sections/resources/ResourcesSection";
import { ServicesSection } from "./sections/services/ServicesSection";
import { StaffSection } from "./sections/staff/StaffSection";
import { CalendarSection } from "./sections/CalendarSection";
import { getTodayValue, addDays } from "./utils";
import { useAdminSession } from "./useAdminSession";
import { ownerTabs, platformTabs, staffTabs, TabKey } from "./types";
import { useAdminPlatform } from "./hooks/useAdminPlatform";
import { useAdminCatalog } from "./hooks/useAdminCatalog";
import { useAdminBusinessSettings } from "./hooks/useAdminBusinessSettings";
import { useAdminBlocks } from "./hooks/useAdminBlocks";
import { useAdminAppointments } from "./hooks/useAdminAppointments";
import { useAdminCalendar } from "./hooks/useAdminCalendar";

export function AdminApp() {
  const { token, businessId, role, resourceId, login, logout } = useAdminSession();
  const [activeTab, setActiveTab] = useState<TabKey>("services");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useMemo(() => ({ token }), [token]);
  const resetError = () => setError(null);

  const apiContext = {
    authHeaders,
    businessId,
    role,
    resourceId,
    setLoading,
    setError,
    resetError
  };

  const platform = useAdminPlatform(apiContext);
  const catalog = useAdminCatalog(apiContext);
  const businessSettings = useAdminBusinessSettings(apiContext);
  const blocks = useAdminBlocks(apiContext);
  const appointments = useAdminAppointments(apiContext);
  const calendar = useAdminCalendar(apiContext);

  React.useEffect(() => {
    if (role === "staff") {
      setActiveTab("appointments");
    }
    if (role === "platform_admin") {
      setActiveTab("platform_businesses");
    }
  }, [role]);

  React.useEffect(() => {
    if (!businessId) return;
    catalog.resetLoaded();
    blocks.resetLoaded();
    appointments.resetLoaded();
    businessSettings.resetLoaded();
    calendar.resetLoaded();
  }, [businessId]);

  React.useEffect(() => {
    if (role === "platform_admin" && activeTab === "platform_businesses") {
      if (!platform.businessesLoaded) {
        void platform.loadBusinesses();
      }
    }
  }, [activeTab, platform, role]);

  const isAuthed = token.length > 0 && (role === "platform_admin" || businessId.length > 0);

  const availableTabs =
    role === "staff" ? staffTabs : role === "platform_admin" ? platformTabs : ownerTabs;
  const canUseBusinessTabs = role !== "platform_admin" || businessId.length > 0;

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetError();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "").trim();

    if (!email || !password) {
      setError("Completa email y password.");
      return;
    }

    try {
      setLoading(true);
      const payload = await login(email, password);
      if (payload.role === "staff") {
        setActiveTab("appointments");
      } else if (payload.role === "platform_admin") {
        setActiveTab("platform_businesses");
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

  async function onPlatformBusinesses() {
    await platform.loadBusinesses();
  }

  async function onPlatformOwners() {
    if (!platform.platformOwnersLoaded) {
      await platform.loadPlatformOwners();
    }
  }

  async function onPlatformStaff() {
    if (!platform.platformStaffLoaded) {
      await platform.loadPlatformStaff();
    }
  }

  async function onPlatformAppointments() {
    const nextDate = platform.platformAppointmentsDate || getTodayValue();
    if (!platform.platformAppointmentsDate) {
      platform.setPlatformAppointmentsDate(nextDate);
    }
    if (!platform.platformAppointmentsLoaded) {
      await platform.loadPlatformAppointments(
        nextDate,
        platform.platformAppointmentsStatus,
        platform.platformAppointmentsSearch
      );
    }
  }

  async function onBlocksTab() {
    if (role === "staff") {
      await blocks.loadBlocks();
      return;
    }
    await Promise.all([blocks.loadBlocks(), catalog.ensureResourcesLoaded()]);
  }

  async function onAppointmentsTab() {
    const nextDate = appointments.appointmentsDate || getTodayValue();
    if (!appointments.appointmentsDate) {
      appointments.setAppointmentsDate(nextDate);
    }
    if (role === "staff") {
      await appointments.loadAppointments(
        nextDate,
        appointments.appointmentsStatus,
        appointments.appointmentsSearch
      );
      return;
    }
    await Promise.all([
      appointments.loadAppointments(
        nextDate,
        appointments.appointmentsStatus,
        appointments.appointmentsSearch
      ),
      catalog.ensureResourcesLoaded(),
      catalog.ensureServicesLoaded()
    ]);
  }

  function handleTabSelect(tab: TabKey) {
    setActiveTab(tab);
    if (tab === "platform_businesses") {
      if (!platform.businessesLoaded) {
        void onPlatformBusinesses();
      }
      return;
    }
    if (tab === "platform_owners") {
      void onPlatformOwners();
      return;
    }
    if (tab === "platform_staff") {
      void onPlatformStaff();
      return;
    }
    if (tab === "platform_appointments") {
      void onPlatformAppointments();
      return;
    }
    if (tab === "services") {
      if (!catalog.servicesLoaded) {
        void catalog.loadServices();
      }
      return;
    }
    if (tab === "resources") {
      if (!catalog.resourcesLoaded) {
        void catalog.loadResources();
      }
      return;
    }
    if (tab === "staff") {
      if (!catalog.staffLoaded) {
        void Promise.all([catalog.loadStaff(), catalog.ensureResourcesLoaded()]);
      }
      return;
    }
    if (tab === "blocks") {
      if (!blocks.blocksLoaded) {
        void onBlocksTab();
      }
      return;
    }
    if (tab === "calendar") {
      if (!calendar.calendarLoaded) {
        void Promise.all([catalog.ensureResourcesLoaded(), catalog.ensureServicesLoaded()]);
        void calendar.loadCalendarData();
      }
      return;
    }
    if (tab === "business" || tab === "hours" || tab === "policies") {
      if (!businessSettings.businessLoaded) {
        void businessSettings.loadBusinessSettings();
      }
      return;
    }
    if (tab === "appointments") {
      if (!appointments.appointmentsLoaded) {
        void onAppointmentsTab();
      }
    }
  }

  if (!isAuthed) {
    return <AdminLogin error={error} loading={loading} onLogin={handleLogin} />;
  }

  return (
    <div className="space-y-6">
      <AdminHeader businessId={businessId} role={role} onLogout={handleLogout} />

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <AdminSidebar
          activeTab={activeTab}
          availableTabs={availableTabs}
          canUseBusinessTabs={canUseBusinessTabs}
          onSelectTab={handleTabSelect}
        />

        <div className="space-y-6">
          {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}

          {role === "platform_admin" && activeTab.startsWith("platform_") && (
            <PlatformSection
              activeTab={activeTab}
              businesses={platform.businesses}
              ownerBusinessId={platform.ownerBusinessId}
              setOwnerBusinessId={platform.setOwnerBusinessId}
              loadBusinesses={platform.loadBusinesses}
              createBusiness={platform.createBusiness}
              updateBusiness={platform.updateBusiness}
              deleteBusiness={platform.deleteBusiness}
              createOwner={platform.createOwner}
              owners={platform.platformOwners}
              staff={platform.platformStaff}
              appointments={platform.platformAppointments}
              appointmentsDate={platform.platformAppointmentsDate}
              setAppointmentsDate={platform.setPlatformAppointmentsDate}
              appointmentsStatus={platform.platformAppointmentsStatus}
              setAppointmentsStatus={platform.setPlatformAppointmentsStatus}
              appointmentsSearch={platform.platformAppointmentsSearch}
              setAppointmentsSearch={platform.setPlatformAppointmentsSearch}
              loadOwners={platform.loadPlatformOwners}
              loadStaff={platform.loadPlatformStaff}
              loadAppointments={() => platform.loadPlatformAppointments()}
              updatePlatformUser={platform.updatePlatformUser}
              deletePlatformUser={platform.deletePlatformUser}
            />
          )}

          {activeTab === "business" && role !== "staff" && (
            <BusinessSection
              businessProfile={businessSettings.businessProfile}
              loadBusinessSettings={businessSettings.loadBusinessSettings}
              saveBusinessProfile={businessSettings.saveBusinessProfile}
            />
          )}

          {activeTab === "services" && role !== "staff" && (
            <ServicesSection
              services={catalog.services}
              resources={catalog.resources}
              createService={catalog.createService}
              updateService={catalog.updateService}
              deleteService={catalog.deleteService}
              loadServices={catalog.loadServices}
              ensureResourcesLoaded={catalog.ensureResourcesLoaded}
            />
          )}

          {activeTab === "resources" && role !== "staff" && (
            <ResourcesSection
              resources={catalog.resources}
              createResource={catalog.createResource}
              updateResource={catalog.updateResource}
              deleteResource={catalog.deleteResource}
              loadResources={catalog.loadResources}
            />
          )}

          {activeTab === "staff" && role !== "staff" && (
            <StaffSection
              staff={catalog.staff}
              resources={catalog.resources}
              createStaff={catalog.createStaff}
              updateStaff={catalog.updateStaff}
              deleteStaff={catalog.deleteStaff}
              loadStaff={catalog.loadStaff}
              loadResources={catalog.loadResources}
            />
          )}

          {activeTab === "blocks" && (
            <BlocksSection
              blocks={blocks.blocks}
              resources={catalog.resources}
              createBlock={blocks.createBlock}
              updateBlock={blocks.updateBlock}
              deleteBlock={blocks.deleteBlock}
              loadBlocks={blocks.loadBlocks}
              role={role}
              resourceId={resourceId}
            />
          )}

          {activeTab === "hours" && role !== "staff" && (
            <HoursSection hours={businessSettings.hours} saveHours={businessSettings.saveHours} />
          )}

          {activeTab === "policies" && role !== "staff" && (
            <PoliciesSection
              policies={businessSettings.policies}
              savePolicies={businessSettings.savePolicies}
            />
          )}

          {activeTab === "appointments" && (
            <AppointmentsSection
              appointments={appointments.appointments}
              services={catalog.services}
              resources={catalog.resources}
              appointmentsDate={appointments.appointmentsDate}
              setAppointmentsDate={appointments.setAppointmentsDate}
              appointmentsStatus={appointments.appointmentsStatus}
              setAppointmentsStatus={appointments.setAppointmentsStatus}
              appointmentsSearch={appointments.appointmentsSearch}
              setAppointmentsSearch={appointments.setAppointmentsSearch}
              loadAppointments={() => appointments.loadAppointments()}
              updateAppointmentStatus={appointments.updateAppointmentStatus}
            />
          )}

          {activeTab === "calendar" && (
            <CalendarSection
              weekStart={calendar.calendarWeekStart}
              intervalMinutes={calendar.calendarInterval}
              onPrevWeek={() => {
                const prev = addDays(calendar.calendarWeekStart, -7);
                calendar.setCalendarWeekStart(prev);
                void calendar.loadCalendarData(prev);
              }}
              onNextWeek={() => {
                const next = addDays(calendar.calendarWeekStart, 7);
                calendar.setCalendarWeekStart(next);
                void calendar.loadCalendarData(next);
              }}
              onIntervalChange={calendar.setCalendarInterval}
              onSelectResource={calendar.setCalendarResourceId}
              selectedResourceId={calendar.calendarResourceId}
              resources={catalog.resources}
              services={catalog.services}
              appointments={calendar.calendarAppointments}
              blocks={calendar.calendarBlocks}
              onCreateAppointment={calendar.createAppointment}
              onCreateBlock={calendar.createCalendarBlock}
              onUpdateAppointment={calendar.updateAppointmentDetails}
              onCancelAppointment={calendar.cancelAppointment}
              role={role}
              resourceId={resourceId}
            />
          )}

          {loading && <p className="text-sm text-slate-500">Cargando...</p>}
        </div>
      </div>
    </div>
  );
}
