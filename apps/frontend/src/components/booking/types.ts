export interface BusinessResponse {
  business: {
    _id: string;
    name: string;
    slug: string;
    timezone: string;
  };
  services: ServiceItem[];
  resources: ResourceItem[];
}

export interface ServiceItem {
  _id: string;
  name: string;
  durationMinutes: number;
  price?: number;
  allowedResourceIds?: string[];
}

export interface ResourceItem {
  _id: string;
  name: string;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  resourceIds: string[];
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
}
