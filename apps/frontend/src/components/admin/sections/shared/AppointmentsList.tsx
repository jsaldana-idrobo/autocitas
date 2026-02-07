import React, { useMemo } from "react";
import { AppointmentItem, ResourceItem, ServiceItem } from "../../types";
import { Badge } from "../../ui/Badge";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "../../ui/DataTable";

type AppointmentsListProps = Readonly<{
  variant: "business" | "platform";
  appointments: AppointmentItem[];
  emptyLabel: string;
  onView: (appointment: AppointmentItem) => void;
  onComplete?: (appointmentId: string) => void;
  onCancel?: (appointmentId: string) => void;
  services?: ServiceItem[];
  resources?: ResourceItem[];
}>;

export function AppointmentsList({
  variant,
  appointments,
  emptyLabel,
  onView,
  onComplete,
  onCancel,
  services = [],
  resources = []
}: AppointmentsListProps) {
  const serviceLookup = useMemo(() => {
    return new Map(services.map((service) => [service._id, service.name]));
  }, [services]);

  const resourceLookup = useMemo(() => {
    return new Map(resources.map((resource) => [resource._id, resource.name]));
  }, [resources]);

  const renderStatus = (item: AppointmentItem) => {
    if (variant === "platform") {
      return <span className="capitalize">{item.status}</span>;
    }
    const tone =
      item.status === "booked" ? "warning" : item.status === "completed" ? "success" : "danger";
    return <Badge tone={tone}>{item.status}</Badge>;
  };

  const renderActions = (item: AppointmentItem) => {
    if (variant === "platform") {
      return (
        <button
          className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
          onClick={() => onView(item)}
        >
          Ver
        </button>
      );
    }

    return (
      <>
        <button
          className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
          onClick={() => onView(item)}
        >
          Ver
        </button>
        <button
          className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
          onClick={() => onComplete?.(item._id)}
        >
          Completar
        </button>
        <button
          className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
          onClick={() => onCancel?.(item._id)}
        >
          Cancelar
        </button>
      </>
    );
  };

  return (
    <>
      <div className="mt-4 hidden md:block">
        <DataTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Cliente</TableHeaderCell>
              {variant === "business" ? (
                <TableHeaderCell>Servicio</TableHeaderCell>
              ) : (
                <TableHeaderCell>Horario</TableHeaderCell>
              )}
              {variant === "business" ? (
                <TableHeaderCell>Horario</TableHeaderCell>
              ) : (
                <TableHeaderCell>Estado</TableHeaderCell>
              )}
              {variant === "platform" ? (
                <TableHeaderCell>Business ID</TableHeaderCell>
              ) : (
                <TableHeaderCell>Estado</TableHeaderCell>
              )}
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.map((item) => {
              const serviceName = serviceLookup.get(item.serviceId) ?? item.serviceName ?? "-";
              const resourceName =
                resourceLookup.get(item.resourceId ?? "") ?? item.resourceName ?? "-";
              return (
                <TableRow key={item._id}>
                  <TableCell>
                    <div className="font-medium">{item.customerName}</div>
                    <div className="text-xs text-slate-500">{item.customerPhone}</div>
                  </TableCell>
                  {variant === "business" ? (
                    <TableCell>
                      <div>{serviceName}</div>
                      <div className="text-xs text-slate-500">{resourceName}</div>
                    </TableCell>
                  ) : (
                    <TableCell>
                      <div className="text-sm">{new Date(item.startTime).toLocaleString()}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(item.endTime).toLocaleString()}
                      </div>
                    </TableCell>
                  )}
                  {variant === "business" ? (
                    <TableCell>
                      <div className="text-sm">{new Date(item.startTime).toLocaleString()}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(item.endTime).toLocaleString()}
                      </div>
                    </TableCell>
                  ) : (
                    <TableCell>{renderStatus(item)}</TableCell>
                  )}
                  {variant === "platform" ? (
                    <TableCell>{item.businessId ?? "-"}</TableCell>
                  ) : (
                    <TableCell>{renderStatus(item)}</TableCell>
                  )}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">{renderActions(item)}</div>
                  </TableCell>
                </TableRow>
              );
            })}
            {appointments.length === 0 && (
              <TableRow>
                <TableCell className="text-slate-500" colSpan={5}>
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </DataTable>
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {appointments.map((item) => {
          const serviceName = serviceLookup.get(item.serviceId) ?? item.serviceName ?? "-";
          const resourceName =
            resourceLookup.get(item.resourceId ?? "") ?? item.resourceName ?? "-";
          return (
            <div key={item._id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-slate-900">{item.customerName}</div>
                  <div className="text-xs text-slate-500">{item.customerPhone}</div>
                </div>
                {variant === "business" ? renderStatus(item) : null}
              </div>
              {variant === "business" ? (
                <>
                  <div className="mt-2 text-sm text-slate-700">{serviceName}</div>
                  <div className="text-xs text-slate-500">{resourceName}</div>
                </>
              ) : (
                <div className="mt-2 text-xs text-slate-500 capitalize">{item.status}</div>
              )}
              <div className="mt-2 text-xs text-slate-500">
                {new Date(item.startTime).toLocaleString()} →{" "}
                {new Date(item.endTime).toLocaleString()}
              </div>
              {variant === "platform" && (
                <div className="mt-2 text-xs text-slate-500">
                  Business ID: {item.businessId ?? "-"}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">{renderActions(item)}</div>
            </div>
          );
        })}
        {appointments.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </>
  );
}
