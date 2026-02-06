import React from "react";
import { PlatformAppointmentsTable } from "./PlatformAppointmentsTable";
import { PlatformBusinessesTable } from "./PlatformBusinessesTable";
import { PlatformUsersTable } from "./PlatformUsersTable";
import { PlatformCreateOwnerModal } from "./PlatformCreateOwnerModal";
import { PlatformServicesSection } from "./PlatformServicesSection";
import { PlatformResourcesSection } from "./PlatformResourcesSection";
import { PlatformBlocksSection } from "./PlatformBlocksSection";
import { PlatformHoursSection } from "./PlatformHoursSection";
import { PlatformPoliciesSection } from "./PlatformPoliciesSection";
import { PlatformCalendarSection } from "./PlatformCalendarSection";
import type { PlatformSectionProps } from "./PlatformSection.types";

export function PlatformSection({
  activeTab,
  businesses,
  businessesTotal,
  ownerBusinessId,
  setOwnerBusinessId,
  loadBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  createOwner,
  owners,
  ownersTotal,
  staff,
  staffTotal,
  appointments,
  appointmentsTotal,
  appointmentsDate,
  setAppointmentsDate,
  appointmentsStatus,
  setAppointmentsStatus,
  appointmentsSearch,
  setAppointmentsSearch,
  loadOwners,
  loadStaff,
  loadAppointments,
  updatePlatformUser,
  deletePlatformUser,
  services,
  servicesTotal,
  resources,
  resourcesTotal,
  blocks,
  blocksTotal,
  onRefreshServices,
  onRefreshResources,
  onRefreshBlocks,
  onCreateService,
  onUpdateService,
  onDeleteService,
  onCreateResource,
  onUpdateResource,
  onDeleteResource,
  onCreateBlock,
  onUpdateBlock,
  onDeleteBlock,
  onSaveHours,
  onSavePolicies,
  authHeaders,
  onError,
  onSuccess,
  onLoading
}: PlatformSectionProps) {
  const [ownerModalOpen, setOwnerModalOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      {activeTab === "platform_businesses" && (
        <PlatformBusinessesTable
          businesses={businesses}
          onRefresh={loadBusinesses}
          onCreate={createBusiness}
          onUpdate={updateBusiness}
          onDelete={deleteBusiness}
          total={businessesTotal}
        />
      )}

      {activeTab === "platform_owners" && (
        <PlatformUsersTable
          title="Owners"
          users={owners}
          onRefresh={loadOwners}
          onUpdate={updatePlatformUser}
          onDelete={deletePlatformUser}
          total={ownersTotal}
          actions={
            <button
              className="rounded-xl bg-primary-600 px-3 py-2 text-sm text-white"
              onClick={() => setOwnerModalOpen(true)}
            >
              Nuevo owner
            </button>
          }
        />
      )}

      {activeTab === "platform_staff" && (
        <PlatformUsersTable
          title="Staff"
          users={staff}
          onRefresh={loadStaff}
          onUpdate={updatePlatformUser}
          onDelete={deletePlatformUser}
          total={staffTotal}
        />
      )}

      {activeTab === "platform_appointments" && (
        <PlatformAppointmentsTable
          appointments={appointments}
          date={appointmentsDate}
          status={appointmentsStatus}
          search={appointmentsSearch}
          setDate={setAppointmentsDate}
          setStatus={setAppointmentsStatus}
          setSearch={setAppointmentsSearch}
          onSearch={loadAppointments}
          onRefresh={loadAppointments}
          total={appointmentsTotal}
        />
      )}

      {activeTab === "platform_services" && (
        <PlatformServicesSection
          services={services}
          resources={resources}
          businesses={businesses}
          onRefresh={onRefreshServices}
          onCreate={onCreateService}
          onUpdate={onUpdateService}
          onDelete={onDeleteService}
          total={servicesTotal}
          authHeaders={authHeaders}
        />
      )}

      {activeTab === "platform_resources" && (
        <PlatformResourcesSection
          resources={resources}
          businesses={businesses}
          onRefresh={onRefreshResources}
          onCreate={onCreateResource}
          onUpdate={onUpdateResource}
          onDelete={onDeleteResource}
          total={resourcesTotal}
          authHeaders={authHeaders}
        />
      )}

      {activeTab === "platform_blocks" && (
        <PlatformBlocksSection
          blocks={blocks}
          resources={resources}
          businesses={businesses}
          onRefresh={onRefreshBlocks}
          onCreate={onCreateBlock}
          onUpdate={onUpdateBlock}
          onDelete={onDeleteBlock}
          total={blocksTotal}
          authHeaders={authHeaders}
        />
      )}

      {activeTab === "platform_hours" && (
        <PlatformHoursSection
          businesses={businesses}
          onSaveHours={onSaveHours}
          onRefresh={(page, limit) => loadBusinesses(page, limit)}
          total={businessesTotal}
        />
      )}

      {activeTab === "platform_policies" && (
        <PlatformPoliciesSection
          businesses={businesses}
          onSavePolicies={onSavePolicies}
          onRefresh={(page, limit) => loadBusinesses(page, limit)}
          total={businessesTotal}
        />
      )}

      {activeTab === "platform_calendar" && (
        <PlatformCalendarSection
          businesses={businesses}
          resources={resources}
          services={services}
          authHeaders={authHeaders}
          onError={onError}
          onSuccess={onSuccess}
          onLoading={onLoading}
        />
      )}

      <PlatformCreateOwnerModal
        open={ownerModalOpen}
        onClose={() => setOwnerModalOpen(false)}
        ownerBusinessId={ownerBusinessId}
        setOwnerBusinessId={setOwnerBusinessId}
        authHeaders={authHeaders}
        businesses={businesses}
        onSubmit={(event) => {
          createOwner(event);
          setOwnerModalOpen(false);
        }}
      />
    </div>
  );
}
