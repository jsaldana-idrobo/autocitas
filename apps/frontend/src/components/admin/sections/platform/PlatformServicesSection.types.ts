import type { BusinessProfile, ResourceItem, ServiceItem } from "../../types";

export type PlatformServicesSectionProps = Readonly<{
  services: ServiceItem[];
  resources: ResourceItem[];
  businesses: BusinessProfile[];
  onRefresh: (options?: {
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
  onCreate: (
    businessId: string,
    payload: { name: string; durationMinutes: number; price?: number }
  ) => void;
  onUpdate: (businessId: string, serviceId: string, payload: Partial<ServiceItem>) => void;
  onDelete: (businessId: string, serviceId: string) => void;
  total: number;
  authHeaders: { token: string };
}>;
