import React from "react";
import {
  AppointmentItem,
  BusinessProfile,
  PlatformUserUpdate,
  StaffItem,
  TabKey
} from "../../types";
import { PlatformAppointmentsTable } from "./PlatformAppointmentsTable";
import { PlatformBusinessesTable } from "./PlatformBusinessesTable";
import { PlatformUsersTable } from "./PlatformUsersTable";
import { PlatformCreateOwnerModal } from "./PlatformCreateOwnerModal";

export function PlatformSection({
  activeTab,
  businesses,
  ownerBusinessId,
  setOwnerBusinessId,
  loadBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  createOwner,
  onSelectBusiness,
  owners,
  staff,
  appointments,
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
  deletePlatformUser
}: {
  activeTab: TabKey;
  businesses: BusinessProfile[];
  ownerBusinessId: string;
  setOwnerBusinessId: (value: string) => void;
  loadBusinesses: () => void;
  createBusiness: (event: React.FormEvent<HTMLFormElement>) => void;
  updateBusiness: (businessId: string, payload: Partial<BusinessProfile>) => void;
  deleteBusiness: (businessId: string) => void;
  createOwner: (event: React.FormEvent<HTMLFormElement>) => void;
  onSelectBusiness: (businessId: string) => void;
  owners: StaffItem[];
  staff: StaffItem[];
  appointments: AppointmentItem[];
  appointmentsDate: string;
  setAppointmentsDate: (value: string) => void;
  appointmentsStatus: string;
  setAppointmentsStatus: (value: string) => void;
  appointmentsSearch: string;
  setAppointmentsSearch: (value: string) => void;
  loadOwners: () => void;
  loadStaff: () => void;
  loadAppointments: () => void;
  updatePlatformUser: (userId: string, payload: PlatformUserUpdate) => void;
  deletePlatformUser: (userId: string) => void;
}) {
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
          onSelectBusiness={onSelectBusiness}
        />
      )}

      {activeTab === "platform_owners" && (
        <PlatformUsersTable
          title="Owners"
          users={owners}
          onRefresh={loadOwners}
          onUpdate={updatePlatformUser}
          onDelete={deletePlatformUser}
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
        />
      )}

      <PlatformCreateOwnerModal
        open={ownerModalOpen}
        onClose={() => setOwnerModalOpen(false)}
        ownerBusinessId={ownerBusinessId}
        setOwnerBusinessId={setOwnerBusinessId}
        onSubmit={(event) => {
          createOwner(event);
          setOwnerModalOpen(false);
        }}
      />
    </div>
  );
}
