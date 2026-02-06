import type { ResourceItem, ServiceItem } from "../../types";

export type ServicesSectionProps = Readonly<{
  services: ServiceItem[];
  resources: ResourceItem[];
  createService: (event: React.FormEvent<HTMLFormElement>) => void;
  updateService: (serviceId: string, payload: Partial<ServiceItem>) => void;
  deleteService: (serviceId: string) => void;
  loadServices: (page?: number, limit?: number, search?: string, status?: string) => void;
  ensureResourcesLoaded: () => void;
  total: number;
}>;
