export type TabKey =
  | "platform_businesses"
  | "platform_owners"
  | "platform_staff"
  | "platform_appointments"
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
  name: string;
  durationMinutes: number;
  price?: number;
  active: boolean;
  allowedResourceIds?: string[];
}

export interface ResourceItem {
  _id: string;
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
  resourceId?: string;
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
}

export const tabConfig: { key: TabKey; label: string }[] = [
  { key: "platform_businesses", label: "Negocios" },
  { key: "platform_owners", label: "Owners" },
  { key: "platform_staff", label: "Staff" },
  { key: "platform_appointments", label: "Citas" },
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
  "platform_appointments"
];
