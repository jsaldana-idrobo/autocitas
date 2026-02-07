import React, { useMemo } from "react";
import { AppointmentItem, ResourceItem, ServiceItem } from "../../types";

type AppointmentDetailProps = Readonly<{
  variant: "business" | "platform";
  appointment: AppointmentItem;
  services?: ServiceItem[];
  resources?: ResourceItem[];
}>;

export function AppointmentDetail({
  variant,
  appointment,
  services = [],
  resources = []
}: AppointmentDetailProps) {
  const serviceLookup = useMemo(() => {
    return new Map(services.map((service) => [service._id, service.name]));
  }, [services]);

  const resourceLookup = useMemo(() => {
    return new Map(resources.map((resource) => [resource._id, resource.name]));
  }, [resources]);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="text-sm">
        <div className="text-xs uppercase tracking-wide text-slate-400">Cliente</div>
        <div className="font-medium">{appointment.customerName}</div>
        <div className="text-xs text-slate-500">{appointment.customerPhone}</div>
      </div>
      <div className="text-sm">
        <div className="text-xs uppercase tracking-wide text-slate-400">Estado</div>
        <div className="font-medium">{appointment.status}</div>
      </div>
      {variant === "platform" ? (
        <>
          <div className="text-sm">
            <div className="text-xs uppercase tracking-wide text-slate-400">Business ID</div>
            <div className="font-medium">{appointment.businessId ?? "-"}</div>
          </div>
          <div className="text-sm">
            <div className="text-xs uppercase tracking-wide text-slate-400">Servicio ID</div>
            <div className="font-medium">{appointment.serviceId}</div>
          </div>
          <div className="text-sm">
            <div className="text-xs uppercase tracking-wide text-slate-400">Recurso ID</div>
            <div className="font-medium">{appointment.resourceId ?? "-"}</div>
          </div>
        </>
      ) : (
        <>
          <div className="text-sm">
            <div className="text-xs uppercase tracking-wide text-slate-400">Servicio</div>
            <div className="font-medium">
              {serviceLookup.get(appointment.serviceId) ?? appointment.serviceName ?? "-"}
            </div>
          </div>
          <div className="text-sm">
            <div className="text-xs uppercase tracking-wide text-slate-400">Recurso</div>
            <div className="font-medium">
              {resourceLookup.get(appointment.resourceId ?? "") ?? appointment.resourceName ?? "-"}
            </div>
          </div>
        </>
      )}
      <div className="text-sm">
        <div className="text-xs uppercase tracking-wide text-slate-400">Inicio</div>
        <div className="font-medium">{new Date(appointment.startTime).toLocaleString()}</div>
      </div>
      <div className="text-sm">
        <div className="text-xs uppercase tracking-wide text-slate-400">Fin</div>
        <div className="font-medium">{new Date(appointment.endTime).toLocaleString()}</div>
      </div>
    </div>
  );
}
