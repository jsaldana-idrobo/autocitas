import React from "react";
import { BlockItem, ResourceItem } from "../../types";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "../../ui/DataTable";

type BlocksListProps = Readonly<{
  blocks: BlockItem[];
  resources: ResourceItem[];
  emptyLabel: string;
  showBusiness?: boolean;
  showResource?: boolean;
  businessLookup?: Map<string, string>;
  onView: (block: BlockItem) => void;
  onEdit: (block: BlockItem) => void;
  onDelete: (block: BlockItem) => void;
}>;

export function BlocksList({
  blocks,
  resources,
  emptyLabel,
  showBusiness = false,
  showResource = false,
  businessLookup,
  onView,
  onEdit,
  onDelete
}: BlocksListProps) {
  const columnCount = 4 + (showBusiness ? 1 : 0) + (showResource ? 1 : 0);

  const getResourceLabel = (block: BlockItem) => {
    return (
      resources.find((resource) => resource._id === block.resourceId)?.name ||
      block.resourceId ||
      "Todos"
    );
  };

  const getBusinessLabel = (block: BlockItem) => {
    if (!block.businessId) return "-";
    return businessLookup?.get(block.businessId) || block.businessId;
  };

  return (
    <>
      <div className="mt-4 hidden md:block">
        <DataTable>
          <TableHead>
            <TableRow>
              {showBusiness && <TableHeaderCell>Negocio</TableHeaderCell>}
              {showResource && <TableHeaderCell>Recurso</TableHeaderCell>}
              <TableHeaderCell>Motivo</TableHeaderCell>
              <TableHeaderCell>Inicio</TableHeaderCell>
              <TableHeaderCell>Fin</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {blocks.map((block) => (
              <TableRow key={block._id}>
                {showBusiness && <TableCell>{getBusinessLabel(block)}</TableCell>}
                {showResource && <TableCell>{getResourceLabel(block)}</TableCell>}
                <TableCell>{block.reason || "Bloqueo"}</TableCell>
                <TableCell>{new Date(block.startTime).toLocaleString()}</TableCell>
                <TableCell>{new Date(block.endTime).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => onView(block)}
                    >
                      Ver
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => onEdit(block)}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                      onClick={() => onDelete(block)}
                    >
                      Eliminar
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {blocks.length === 0 && (
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
        {blocks.map((block) => (
          <div key={block._id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            {showBusiness && (
              <div className="text-sm text-slate-500">{getBusinessLabel(block)}</div>
            )}
            <div className="text-base font-semibold text-slate-900">
              {block.reason || "Bloqueo"}
            </div>
            {showResource && (
              <div className="text-xs text-slate-500">{getResourceLabel(block)}</div>
            )}
            <div className="mt-2 text-xs text-slate-500">
              Inicio: {new Date(block.startTime).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">
              Fin: {new Date(block.endTime).toLocaleString()}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                onClick={() => onView(block)}
              >
                Ver
              </button>
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                onClick={() => onEdit(block)}
              >
                Editar
              </button>
              <button
                className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                onClick={() => onDelete(block)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {blocks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </>
  );
}
