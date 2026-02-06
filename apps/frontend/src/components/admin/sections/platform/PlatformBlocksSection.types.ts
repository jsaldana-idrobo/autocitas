import type { BlockItem, BusinessProfile, ResourceItem } from "../../types";

export type PlatformBlocksSectionProps = Readonly<{
  blocks: BlockItem[];
  resources: ResourceItem[];
  businesses: BusinessProfile[];
  onRefresh: (options?: {
    page?: number;
    limit?: number;
    businessId?: string;
    resourceId?: string;
    search?: string;
    type?: string;
    from?: string;
    to?: string;
  }) => void;
  onCreate: (businessId: string, payload: Partial<BlockItem>) => void;
  onUpdate: (businessId: string, blockId: string, payload: Partial<BlockItem>) => void;
  onDelete: (businessId: string, blockId: string) => void;
  total: number;
  authHeaders: { token: string };
}>;
