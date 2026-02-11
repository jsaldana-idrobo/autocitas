import type { BusinessProfile, ResourceItem } from "../../types";

export type PlatformResourcesSectionProps = Readonly<{
  resources: ResourceItem[];
  businesses: BusinessProfile[];
  onRefresh: (
    page?: number,
    limit?: number,
    search?: string,
    status?: string,
    businessId?: string
  ) => void;
  onCreate: (businessId: string, payload: { name: string; slug?: string }) => void;
  onUpdate: (businessId: string, resourceId: string, payload: Partial<ResourceItem>) => void;
  onDelete: (businessId: string, resourceId: string) => void;
  total: number;
  authHeaders: { token: string };
}>;
