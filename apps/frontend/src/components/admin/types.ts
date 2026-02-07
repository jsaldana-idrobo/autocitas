export type TabKey =
  | "platform_businesses"
  | "platform_owners"
  | "platform_staff"
  | "platform_appointments"
  | "platform_services"
  | "platform_resources"
  | "platform_blocks"
  | "platform_hours"
  | "platform_policies"
  | "platform_calendar"
  | "business"
  | "services"
  | "resources"
  | "staff"
  | "blocks"
  | "calendar"
  | "hours"
  | "policies"
  | "appointments";

export interface ServiceItem {
  _id: string;
  businessId?: string;
  name: string;
  durationMinutes: number;
  price?: number;
  active: boolean;
  allowedResourceIds?: string[];
}

export interface ResourceItem {
  _id: string;
  businessId?: string;
  name: string;
  active: boolean;
}

export interface StaffItem {
  _id: string;
  email: string;
  role: string;
  active: boolean;
  resourceId?: string;
  businessId?: string;
}

export interface PlatformUserUpdate {
  email?: string;
  password?: string;
  businessId?: string;
  resourceId?: string;
  role?: "owner" | "staff" | "platform_admin";
  active?: boolean;
}

export interface BlockItem {
  _id: string;
  startTime: string;
  endTime: string;
  resourceId?: string;
  reason?: string;
}

export interface BusinessHoursItem {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
}

export interface Policies {
  cancellationHours: number;
  rescheduleLimit: number;
  allowSameDay: boolean;
}

export interface AppointmentItem {
  _id: string;
  serviceId: string;
  serviceName?: string | null;
  resourceId?: string;
  resourceName?: string | null;
  customerName: string;
  customerPhone: string;
  startTime: string;
  endTime: string;
  status: string;
  businessId?: string;
}

export interface BusinessProfile {
  _id?: string;
  name?: string;
  slug?: string;
  timezone?: string;
  contactPhone?: string;
  address?: string;
  status?: "active" | "inactive";
  hours?: BusinessHoursItem[];
  policies?: Policies;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const tabConfig: { key: TabKey; label: string }[] = [
  { key: "platform_businesses", label: "Negocios" },
  { key: "platform_owners", label: "Owners" },
  { key: "platform_staff", label: "Staff" },
  { key: "platform_appointments", label: "Citas" },
  { key: "platform_services", label: "Servicios" },
  { key: "platform_resources", label: "Recursos" },
  { key: "platform_blocks", label: "Bloqueos" },
  { key: "platform_hours", label: "Horarios" },
  { key: "platform_policies", label: "Politicas" },
  { key: "platform_calendar", label: "Calendario" },
  { key: "business", label: "Negocio" },
  { key: "services", label: "Servicios" },
  { key: "resources", label: "Recursos" },
  { key: "staff", label: "Staff" },
  { key: "blocks", label: "Bloqueos" },
  { key: "calendar", label: "Calendario" },
  { key: "hours", label: "Horarios" },
  { key: "policies", label: "Politicas" },
  { key: "appointments", label: "Citas" }
];

export const dayLabels = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

export const ownerTabs: TabKey[] = [
  "business",
  "services",
  "resources",
  "staff",
  "blocks",
  "calendar",
  "hours",
  "policies",
  "appointments"
];

export const staffTabs: TabKey[] = ["blocks", "calendar", "appointments"];

export const platformTabs: TabKey[] = [
  "platform_businesses",
  "platform_owners",
  "platform_staff",
  "platform_appointments",
  "platform_services",
  "platform_resources",
  "platform_blocks",
  "platform_hours",
  "platform_policies",
  "platform_calendar"
];
