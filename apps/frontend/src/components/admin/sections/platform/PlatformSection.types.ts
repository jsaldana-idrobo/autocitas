import type {
  AppointmentItem,
  BlockItem,
  BusinessHoursItem,
  BusinessProfile,
  PlatformUserUpdate,
  Policies,
  ResourceItem,
  ServiceItem,
  StaffItem,
  TabKey
} from "../../types";

export type PlatformSectionProps = Readonly<{
  activeTab: TabKey;
  businesses: BusinessProfile[];
  businessesTotal: number;
  ownerBusinessId: string;
  setOwnerBusinessId: (value: string) => void;
  loadBusinesses: (page?: number, limit?: number, search?: string, status?: string) => void;
  createBusiness: (event: React.FormEvent<HTMLFormElement>) => void;
  updateBusiness: (businessId: string, payload: Partial<BusinessProfile>) => void;
  deleteBusiness: (businessId: string) => void;
  createOwner: (event: React.FormEvent<HTMLFormElement>) => void;
  owners: StaffItem[];
  ownersTotal: number;
  staff: StaffItem[];
  staffTotal: number;
  appointments: AppointmentItem[];
  appointmentsTotal: number;
  appointmentsDate: string;
  setAppointmentsDate: (value: string) => void;
  appointmentsStatus: string;
  setAppointmentsStatus: (value: string) => void;
  appointmentsSearch: string;
  setAppointmentsSearch: (value: string) => void;
  loadOwners: (page?: number, limit?: number, search?: string, status?: string) => void;
  loadStaff: (page?: number, limit?: number, search?: string, status?: string) => void;
  loadAppointments: (page?: number, limit?: number) => void;
  updatePlatformUser: (userId: string, payload: PlatformUserUpdate) => void;
  deletePlatformUser: (userId: string) => void;
  services: ServiceItem[];
  servicesTotal: number;
  resources: ResourceItem[];
  resourcesTotal: number;
  blocks: BlockItem[];
  blocksTotal: number;
  onRefreshServices: (options?: {
    page?: number;
    limit?: number;
    search?: string;
    active?: string;
    businessId?: string;
    minDuration?: string;
    maxDuration?: string;
    minPrice?: string;
    maxPrice?: string;
  }) => void;
  onRefreshResources: (
    page?: number,
    limit?: number,
    search?: string,
    status?: string,
    businessId?: string
  ) => void;
  onRefreshBlocks: (options?: {
    page?: number;
    limit?: number;
    businessId?: string;
    resourceId?: string;
    search?: string;
    type?: string;
    from?: string;
    to?: string;
  }) => void;
  onCreateService: (
    businessId: string,
    payload: { name: string; durationMinutes: number; price?: number }
  ) => void;
  onUpdateService: (businessId: string, serviceId: string, payload: Partial<ServiceItem>) => void;
  onDeleteService: (businessId: string, serviceId: string) => void;
  onCreateResource: (businessId: string, payload: { name: string }) => void;
  onUpdateResource: (
    businessId: string,
    resourceId: string,
    payload: Partial<ResourceItem>
  ) => void;
  onDeleteResource: (businessId: string, resourceId: string) => void;
  onCreateBlock: (businessId: string, payload: Partial<BlockItem>) => void;
  onUpdateBlock: (businessId: string, blockId: string, payload: Partial<BlockItem>) => void;
  onDeleteBlock: (businessId: string, blockId: string) => void;
  onSaveHours: (businessId: string, payload: BusinessHoursItem[]) => void;
  onSavePolicies: (businessId: string, payload: Policies) => void;
  authHeaders: { token: string };
  onError: (message: string | null) => void;
  onSuccess: (message: string | null) => void;
  onLoading: (value: boolean) => void;
}>;
