import React from "react";
import { ServiceItem } from "../../types";
import { Badge } from "../../ui/Badge";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "../../ui/DataTable";

type ServicesListProps = Readonly<{
  services: ServiceItem[];
  emptyLabel: string;
  showBusiness?: boolean;
  businessLookup?: Map<string, string>;
  onView: (service: ServiceItem) => void;
  onEdit: (service: ServiceItem) => void;
  onToggleActive: (service: ServiceItem) => void;
  onDelete: (service: ServiceItem) => void;
}>;

export function ServicesList({
  services,
  emptyLabel,
  showBusiness = false,
  businessLookup,
  onView,
  onEdit,
  onToggleActive,
  onDelete
}: ServicesListProps) {
  const columnCount = showBusiness ? 6 : 5;

  const renderBusinessLabel = (service: ServiceItem) => {
    if (!service.businessId) return "-";
    return businessLookup?.get(service.businessId) || service.businessId;
  };

  return (
    <>
      <div className="mt-4 hidden md:block">
        <DataTable>
          <TableHead>
            <TableRow>
              {showBusiness && <TableHeaderCell>Negocio</TableHeaderCell>}
              <TableHeaderCell>Servicio</TableHeaderCell>
              <TableHeaderCell>Duracion</TableHeaderCell>
              <TableHeaderCell>Precio</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service._id}>
                {showBusiness && <TableCell>{renderBusinessLabel(service)}</TableCell>}
                <TableCell>
                  <div className="font-medium">{service.name}</div>
                </TableCell>
                <TableCell>{service.durationMinutes} min</TableCell>
                <TableCell>${service.price ?? "-"}</TableCell>
                <TableCell>
                  <Badge tone={service.active ? "success" : "warning"}>
                    {service.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => onView(service)}
                    >
                      Ver
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => onEdit(service)}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => onToggleActive(service)}
                    >
                      {service.active ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                      onClick={() => onDelete(service)}
                    >
                      Eliminar
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {services.length === 0 && (
              <TableRow>
                <TableCell className="text-slate-500" colSpan={columnCount}>
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </DataTable>
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {services.map((service) => (
          <div key={service._id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                {showBusiness && (
                  <div className="text-sm text-slate-500">{renderBusinessLabel(service)}</div>
                )}
                <div className="text-base font-semibold text-slate-900">{service.name}</div>
                <div className="text-xs text-slate-500">
                  {service.durationMinutes} min · ${service.price ?? "-"}
                </div>
              </div>
              <Badge tone={service.active ? "success" : "warning"}>
                {service.active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                onClick={() => onView(service)}
              >
                Ver
              </button>
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                onClick={() => onEdit(service)}
              >
                Editar
              </button>
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                onClick={() => onToggleActive(service)}
              >
                {service.active ? "Desactivar" : "Activar"}
              </button>
              <button
                className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                onClick={() => onDelete(service)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </>
  );
}
