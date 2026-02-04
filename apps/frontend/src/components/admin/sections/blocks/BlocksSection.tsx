import React, { useMemo, useState } from "react";
import { BlockItem, ResourceItem } from "../../types";
import { BlockEditor } from "../../components/BlockEditor";
import { InputField } from "../../components/InputField";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "../../ui/DataTable";
import { Modal } from "../../ui/Modal";
import { SectionHeader } from "../../ui/SectionHeader";

export function BlocksSection({
  blocks,
  resources,
  role,
  resourceId,
  createBlock,
  updateBlock,
  deleteBlock,
  loadBlocks
}: {
  blocks: BlockItem[];
  resources: ResourceItem[];
  role: "owner" | "staff" | "platform_admin" | "unknown";
  resourceId?: string;
  createBlock: (event: React.FormEvent<HTMLFormElement>) => void;
  updateBlock: (blockId: string, payload: Partial<BlockItem>) => void;
  deleteBlock: (blockId: string) => void;
  loadBlocks: () => void;
}) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockItem | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return blocks.filter((block) => {
      if (!term) return true;
      return (block.reason || "").toLowerCase().includes(term);
    });
  }, [blocks, search]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <SectionHeader
        title="Bloqueos"
        subtitle="Bloquea horarios no disponibles."
        actions={
          <>
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onClick={loadBlocks}
            >
              Refrescar
            </button>
            <button
              className="rounded-xl bg-primary-600 px-3 py-2 text-sm text-white"
              onClick={() => setCreateOpen(true)}
            >
              Nuevo bloqueo
            </button>
          </>
        }
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Buscar por motivo"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="mt-4">
        <DataTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Motivo</TableHeaderCell>
              <TableHeaderCell>Inicio</TableHeaderCell>
              <TableHeaderCell>Fin</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((block) => (
              <TableRow key={block._id}>
                <TableCell>{block.reason || "Bloqueo"}</TableCell>
                <TableCell>{new Date(block.startTime).toLocaleString()}</TableCell>
                <TableCell>{new Date(block.endTime).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => setEditingBlock(block)}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                      onClick={() => deleteBlock(block._id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell className="text-slate-500" colSpan={4}>
                  No hay bloqueos para los filtros actuales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </DataTable>
      </div>

      <Modal open={createOpen} title="Nuevo bloqueo" onClose={() => setCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            createBlock(event);
            setCreateOpen(false);
          }}
        >
          <InputField name="startTime" label="Inicio" type="datetime-local" />
          <InputField name="endTime" label="Fin" type="datetime-local" />
          {role === "staff" ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:col-span-2">
              Bloqueo asignado a tu recurso
              <input type="hidden" name="resourceId" value={resourceId ?? ""} />
            </div>
          ) : (
            <label className="block text-sm font-medium md:col-span-2">
              Recurso
              <select
                name="resourceId"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              >
                <option value="">Todos</option>
                {resources.map((resource) => (
                  <option key={resource._id} value={resource._id}>
                    {resource.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <InputField name="reason" label="Motivo" placeholder="Cita personal" />
          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
              onClick={() => setCreateOpen(false)}
            >
              Cancelar
            </button>
            <button
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm text-white"
              type="submit"
            >
              Crear
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(editingBlock)}
        title="Editar bloqueo"
        onClose={() => setEditingBlock(null)}
      >
        {editingBlock && (
          <BlockEditor
            item={editingBlock}
            resources={resources}
            canEditResource={role !== "staff"}
            onCancel={() => setEditingBlock(null)}
            onSave={(payload) => {
              updateBlock(editingBlock._id, payload);
              setEditingBlock(null);
            }}
          />
        )}
      </Modal>
    </section>
  );
}
