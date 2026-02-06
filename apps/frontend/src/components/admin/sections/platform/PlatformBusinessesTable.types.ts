import type { BusinessProfile } from "../../types";

export type PlatformBusinessesTableProps = Readonly<{
  businesses: BusinessProfile[];
  onRefresh: (page?: number, limit?: number, search?: string, status?: string) => void;
  onCreate: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdate: (businessId: string, payload: Partial<BusinessProfile>) => void;
  onDelete: (businessId: string) => void;
  total: number;
}>;
