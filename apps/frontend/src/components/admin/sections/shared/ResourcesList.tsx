import React from "react";
import { ResourceItem } from "../../types";
import { Badge } from "../../ui/Badge";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "../../ui/DataTable";

type ResourcesListProps = {
  resources: ResourceItem[];
  emptyLabel: string;
  showBusiness?: boolean;
  businessLookup?: Map<string, string>;
  onView: (resource: ResourceItem) => void;
  onEdit: (resource: ResourceItem) => void;
  onToggleActive: (resource: ResourceItem) => void;
  onDelete: (resource: ResourceItem) => void;
};

export function ResourcesList({
  resources,
  emptyLabel,
  showBusiness = false,
  businessLookup,
  onView,
  onEdit,
  onToggleActive,
  onDelete
}: ResourcesListProps) {
  const columnCount = showBusiness ? 4 : 3;

  const renderBusinessLabel = (resource: ResourceItem) => {
    if (!resource.businessId) return "-";
    return businessLookup?.get(resource.businessId) || resource.businessId;
  };

  return (
    <>
      <div className="mt-4 hidden md:block">
        <DataTable>
          <TableHead>
            <TableRow>
              {showBusiness && <TableHeaderCell>Negocio</TableHeaderCell>}
              <TableHeaderCell>Recurso</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {resources.map((resource) => (
              <TableRow key={resource._id}>
                {showBusiness && <TableCell>{renderBusinessLabel(resource)}</TableCell>}
                <TableCell>
                  <div className="font-medium">{resource.name}</div>
                </TableCell>
                <TableCell>
                  <Badge tone={resource.active ? "success" : "warning"}>
                    {resource.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => onView(resource)}
                    >
                      Ver
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => onEdit(resource)}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => onToggleActive(resource)}
                    >
                      {resource.active ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                      onClick={() => onDelete(resource)}
                    >
                      Eliminar
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {resources.length === 0 && (
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
        {resources.map((resource) => (
          <div
            key={resource._id}
            className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                {showBusiness && (
                  <div className="text-sm text-slate-500">{renderBusinessLabel(resource)}</div>
                )}
                <div className="text-base font-semibold text-slate-900">{resource.name}</div>
              </div>
              <Badge tone={resource.active ? "success" : "warning"}>
                {resource.active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                onClick={() => onView(resource)}
              >
                Ver
              </button>
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                onClick={() => onEdit(resource)}
              >
                Editar
              </button>
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                onClick={() => onToggleActive(resource)}
              >
                {resource.active ? "Desactivar" : "Activar"}
              </button>
              <button
                className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                onClick={() => onDelete(resource)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {resources.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </>
  );
}
