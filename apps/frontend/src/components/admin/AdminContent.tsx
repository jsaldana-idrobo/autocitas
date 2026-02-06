import React from "react";
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
import { useAdminAppointments } from "./hooks/useAdminAppointments";
import { useAdminBlocks } from "./hooks/useAdminBlocks";
import { useAdminBusinessSettings } from "./hooks/useAdminBusinessSettings";
import { useAdminCalendar } from "./hooks/useAdminCalendar";
import { useAdminCatalog } from "./hooks/useAdminCatalog";
import { useAdminPlatform } from "./hooks/useAdminPlatform";
import { TabKey } from "./types";

export type AdminContentProps = {
  role: string;
  resourceId: string;
  activeTab: TabKey;
  platform: ReturnType<typeof useAdminPlatform>;
  catalog: ReturnType<typeof useAdminCatalog>;
  businessSettings: ReturnType<typeof useAdminBusinessSettings>;
  blocks: ReturnType<typeof useAdminBlocks>;
  appointments: ReturnType<typeof useAdminAppointments>;
  calendar: ReturnType<typeof useAdminCalendar>;
  authHeaders: { token: string };
  onError: (value: string | null) => void;
  onSuccess: (value: string | null) => void;
  onLoading: (value: boolean) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  loading: boolean;
};

export function AdminContent({
  role,
  resourceId,
  activeTab,
  platform,
  catalog,
  businessSettings,
  blocks,
  appointments,
  calendar,
  authHeaders,
  onError,
  onSuccess,
  onLoading,
  onPrevWeek,
  onNextWeek,
  loading
}: AdminContentProps) {
  return (
    <div className="space-y-6">
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
          onError={onError}
          onSuccess={onSuccess}
          onLoading={onLoading}
        />
      )}

      {activeTab === "business" && role === "owner" && (
        <BusinessSection
          businessProfile={businessSettings.businessProfile}
          loadBusinessSettings={businessSettings.loadBusinessSettings}
          saveBusinessProfile={businessSettings.saveBusinessProfile}
        />
      )}

      {activeTab === "services" && role === "owner" && (
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

      {activeTab === "resources" && role === "owner" && (
        <ResourcesSection
          resources={catalog.resources}
          createResource={catalog.createResource}
          updateResource={catalog.updateResource}
          deleteResource={catalog.deleteResource}
          loadResources={catalog.loadResources}
          total={catalog.resourcesTotal}
        />
      )}

      {activeTab === "staff" && role === "owner" && (
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

      {activeTab === "hours" && role === "owner" && (
        <HoursSection hours={businessSettings.hours} saveHours={businessSettings.saveHours} />
      )}

      {activeTab === "policies" && role === "owner" && (
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
          onPrevWeek={onPrevWeek}
          onNextWeek={onNextWeek}
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
  );
}
