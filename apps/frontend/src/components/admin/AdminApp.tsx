import React, { useMemo, useState } from "react";
import { AdminHeader } from "./components/AdminHeader";
import { AdminLogin } from "./components/AdminLogin";
import { AdminSidebar } from "./components/AdminSidebar";
import { ToastItem, ToastStack } from "./ui/Toast";
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
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const authHeaders = useMemo(() => ({ token }), [token]);
  const resetError = React.useCallback(() => setError(null), []);
  const resetSuccess = React.useCallback(() => {}, []);
  const pushToast = React.useCallback((message: string, variant: "success" | "error") => {
    setToasts((prev) => {
      const next = [
        ...prev,
        { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, message, variant }
      ];
      return next.slice(-3);
    });
  }, []);

  const apiContext = useMemo(
    () => ({
      authHeaders,
      businessId,
      role,
      resourceId,
      setLoading,
      setError: (value: string | null) => {
        setError(value);
        if (value) pushToast(value, "error");
      },
      setSuccess: (value: string | null) => {
        if (value) pushToast(value, "success");
      },
      resetError,
      resetSuccess
    }),
    [authHeaders, businessId, role, resourceId, setLoading, resetError, resetSuccess, pushToast]
  );

  const platform = useAdminPlatform(apiContext);
  const catalog = useAdminCatalog(apiContext);
  const businessSettings = useAdminBusinessSettings(apiContext);
  const blocks = useAdminBlocks(apiContext);
  const appointments = useAdminAppointments(apiContext);
  const calendar = useAdminCalendar(apiContext);
  const resetCatalogLoaded = catalog.resetLoaded;
  const resetBlocksLoaded = blocks.resetLoaded;
  const resetAppointmentsLoaded = appointments.resetLoaded;
  const resetBusinessSettingsLoaded = businessSettings.resetLoaded;
  const resetCalendarLoaded = calendar.resetLoaded;

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
    resetCatalogLoaded();
    resetBlocksLoaded();
    resetAppointmentsLoaded();
    resetBusinessSettingsLoaded();
    resetCalendarLoaded();
  }, [
    businessId,
    resetCatalogLoaded,
    resetBlocksLoaded,
    resetAppointmentsLoaded,
    resetBusinessSettingsLoaded,
    resetCalendarLoaded
  ]);

  React.useEffect(() => {
    if (role === "platform_admin" && activeTab === "platform_businesses") {
      if (!platform.businessesLoaded) {
        void platform.loadBusinesses(1, 25, "", "");
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
    await platform.loadBusinesses(1, 25, "", "");
  }

  async function onPlatformOwners() {
    if (!platform.platformOwnersLoaded) {
      await platform.loadPlatformOwners(1, 25, "", "");
    }
  }

  async function onPlatformStaff() {
    if (!platform.platformStaffLoaded) {
      await platform.loadPlatformStaff(1, 25, "", "");
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
        platform.platformAppointmentsSearch,
        1,
        25
      );
    }
  }

  async function onBlocksTab() {
    if (role === "staff") {
      await blocks.loadBlocks(1, 25, "");
      return;
    }
    await Promise.all([blocks.loadBlocks(1, 25, ""), catalog.ensureResourcesLoaded()]);
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
        appointments.appointmentsSearch,
        1,
        25
      );
      return;
    }
    await Promise.all([
      appointments.loadAppointments(
        nextDate,
        appointments.appointmentsStatus,
        appointments.appointmentsSearch,
        1,
        25
      ),
      catalog.ensureResourcesLoaded(),
      catalog.ensureServicesLoaded()
    ]);
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
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
    if (tab === "platform_services") {
      void (async () => {
        if (!platform.businessesLoaded) {
          await platform.loadBusinesses(1, 25, "", "");
        }
        if (!platform.platformResourcesLoaded) {
          await platform.loadPlatformResources(1, 25, "", "", "");
        }
        if (!platform.platformServicesLoaded) {
          await platform.loadPlatformServices(1, 25, "", "", "");
        }
      })();
      return;
    }
    if (tab === "platform_resources") {
      void (async () => {
        if (!platform.businessesLoaded) {
          await platform.loadBusinesses(1, 25, "", "");
        }
        if (!platform.platformResourcesLoaded) {
          await platform.loadPlatformResources(1, 25, "", "", "");
        }
      })();
      return;
    }
    if (tab === "platform_blocks") {
      void (async () => {
        if (!platform.businessesLoaded) {
          await platform.loadBusinesses(1, 25, "", "");
        }
        if (!platform.platformResourcesLoaded) {
          await platform.loadPlatformResources(1, 25, "", "", "");
        }
        if (!platform.platformBlocksLoaded) {
          await platform.loadPlatformBlocks(1, 25, "", "");
        }
      })();
      return;
    }
    if (tab === "platform_hours" || tab === "platform_policies" || tab === "platform_calendar") {
      void (async () => {
        if (!platform.businessesLoaded) {
          await platform.loadBusinesses(1, 25, "", "");
        }
        if (tab === "platform_calendar") {
          if (!platform.platformResourcesLoaded) {
            await platform.loadPlatformResources(1, 25, "", "", "");
          }
          if (!platform.platformServicesLoaded) {
            await platform.loadPlatformServices(1, 25, "", "", "");
          }
        }
      })();
      return;
    }
    if (tab === "services") {
      if (!catalog.servicesLoaded) {
        void catalog.loadServices(1, 25, "", "");
      }
      return;
    }
    if (tab === "resources") {
      if (!catalog.resourcesLoaded) {
        void catalog.loadResources(1, 25, "", "");
      }
      return;
    }
    if (tab === "staff") {
      if (!catalog.staffLoaded) {
        void Promise.all([catalog.loadStaff(1, 25, "", ""), catalog.ensureResourcesLoaded()]);
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

  function handleToastClose(id: string) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }

  return (
    <>
      <ToastStack toasts={toasts} onClose={handleToastClose} />
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
            {/* Errors are shown via toast to avoid layout shifts */}

            {role === "platform_admin" && activeTab.startsWith("platform_") && (
              <PlatformSection
                activeTab={activeTab}
                businesses={platform.businesses}
                businessesTotal={platform.businessesTotal}
                ownerBusinessId={platform.ownerBusinessId}
                setOwnerBusinessId={platform.setOwnerBusinessId}
                loadBusinesses={platform.loadBusinesses}
                createBusiness={platform.createBusiness}
                updateBusiness={platform.updateBusiness}
                deleteBusiness={platform.deleteBusiness}
                createOwner={platform.createOwner}
                owners={platform.platformOwners}
                ownersTotal={platform.platformOwnersTotal}
                staff={platform.platformStaff}
                staffTotal={platform.platformStaffTotal}
                appointments={platform.platformAppointments}
                appointmentsTotal={platform.platformAppointmentsTotal}
                appointmentsDate={platform.platformAppointmentsDate}
                setAppointmentsDate={platform.setPlatformAppointmentsDate}
                appointmentsStatus={platform.platformAppointmentsStatus}
                setAppointmentsStatus={platform.setPlatformAppointmentsStatus}
                appointmentsSearch={platform.platformAppointmentsSearch}
                setAppointmentsSearch={platform.setPlatformAppointmentsSearch}
                loadOwners={platform.loadPlatformOwners}
                loadStaff={platform.loadPlatformStaff}
                loadAppointments={(page, limit) =>
                  platform.loadPlatformAppointments(
                    platform.platformAppointmentsDate,
                    platform.platformAppointmentsStatus,
                    platform.platformAppointmentsSearch,
                    page,
                    limit
                  )
                }
                updatePlatformUser={platform.updatePlatformUser}
                deletePlatformUser={platform.deletePlatformUser}
                services={platform.platformServices}
                servicesTotal={platform.platformServicesTotal}
                resources={platform.platformResources}
                resourcesTotal={platform.platformResourcesTotal}
                blocks={platform.platformBlocks}
                blocksTotal={platform.platformBlocksTotal}
                onRefreshServices={platform.loadPlatformServices}
                onRefreshResources={platform.loadPlatformResources}
                onRefreshBlocks={platform.loadPlatformBlocks}
                onCreateService={platform.createPlatformService}
                onUpdateService={platform.updatePlatformService}
                onDeleteService={platform.deletePlatformService}
                onCreateResource={platform.createPlatformResource}
                onUpdateResource={platform.updatePlatformResource}
                onDeleteResource={platform.deletePlatformResource}
                onCreateBlock={platform.createPlatformBlock}
                onUpdateBlock={platform.updatePlatformBlock}
                onDeleteBlock={platform.deletePlatformBlock}
                onSaveHours={platform.savePlatformHours}
                onSavePolicies={platform.savePlatformPolicies}
                authHeaders={authHeaders}
                onError={setError}
                onSuccess={setSuccess}
                onLoading={setLoading}
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
                total={catalog.servicesTotal}
              />
            )}

            {activeTab === "resources" && role !== "staff" && (
              <ResourcesSection
                resources={catalog.resources}
                createResource={catalog.createResource}
                updateResource={catalog.updateResource}
                deleteResource={catalog.deleteResource}
                loadResources={catalog.loadResources}
                total={catalog.resourcesTotal}
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
                total={catalog.staffTotal}
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
                total={blocks.blocksTotal}
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
                loadAppointments={appointments.loadAppointments}
                updateAppointmentStatus={appointments.updateAppointmentStatus}
                total={appointments.appointmentsTotal}
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
                userRole={role}
                resourceId={resourceId}
              />
            )}

            {loading && <p className="text-sm text-slate-500">Cargando...</p>}
          </div>
        </div>
      </div>
    </>
  );
}
