import type { ResourceItem, StaffItem } from "../../types";

export type StaffSectionProps = Readonly<{
  staff: StaffItem[];
  resources: ResourceItem[];
  createStaff: (event: React.FormEvent<HTMLFormElement>) => void;
  updateStaff: (
    staffId: string,
    payload: { resourceId?: string; password?: string; active?: boolean }
  ) => void;
  deleteStaff: (staffId: string) => void;
  loadStaff: (page?: number, limit?: number, search?: string, status?: string) => void;
  loadResources: () => void;
  total: number;
}>;
