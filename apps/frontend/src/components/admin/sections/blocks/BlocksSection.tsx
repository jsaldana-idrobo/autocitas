import React, { useEffect, useState } from "react";
import { BlockItem, ResourceItem } from "../../types";
import { BlockEditor } from "../../components/BlockEditor";
import { InputField } from "../../components/InputField";
import { Modal } from "../../ui/Modal";
import { SectionHeader } from "../../ui/SectionHeader";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { BlocksList } from "../shared/BlocksList";
import { ConfirmDeleteModal } from "../../ui/ConfirmDeleteModal";
import { PaginationControls } from "../shared/PaginationControls";

export function BlocksSection({
  blocks,
  resources,
  role,
  resourceId,
  createBlock,
  updateBlock,
  deleteBlock,
  loadBlocks,
  total
}: Readonly<{
  blocks: BlockItem[];
  resources: ResourceItem[];
  role: "owner" | "staff" | "platform_admin" | "unknown";
  resourceId?: string;
  createBlock: (event: React.FormEvent<HTMLFormElement>) => void;
  updateBlock: (blockId: string, payload: Partial<BlockItem>) => void;
  deleteBlock: (blockId: string) => void;
  loadBlocks: (page?: number, limit?: number, search?: string) => void;
  total: number;
}>) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockItem | null>(null);
  const [deletingBlock, setDeletingBlock] = useState<BlockItem | null>(null);
  const [viewingBlock, setViewingBlock] = useState<BlockItem | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    loadBlocks(page, pageSize, debouncedSearch);
  }, [page, pageSize, debouncedSearch, loadBlocks]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
      <SectionHeader
        title="Bloqueos"
        subtitle="Bloquea horarios no disponibles."
        actions={
          <>
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onClick={() => loadBlocks(page, pageSize, search)}
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

      <BlocksList
        blocks={blocks}
        resources={resources}
        emptyLabel="No hay bloqueos para los filtros actuales."
        onView={setViewingBlock}
        onEdit={setEditingBlock}
        onDelete={setDeletingBlock}
      />

      <PaginationControls
        total={total}
        page={page}
        pageSize={pageSize}
        setPage={setPage}
        setPageSize={setPageSize}
      />

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
              <span>Bloqueo asignado a tu recurso</span>
              <input type="hidden" name="resourceId" value={resourceId ?? ""} />
            </div>
          ) : (
            <label className="block text-sm font-medium md:col-span-2">
              <span>Recurso</span>
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

      <Modal
        open={Boolean(viewingBlock)}
        title="Detalle del bloqueo"
        onClose={() => setViewingBlock(null)}
      >
        {viewingBlock && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="text-sm md:col-span-2">
              <div className="text-xs uppercase tracking-wide text-slate-400">Motivo</div>
              <div className="font-medium">{viewingBlock.reason || "Bloqueo"}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Inicio</div>
              <div className="font-medium">{new Date(viewingBlock.startTime).toLocaleString()}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Fin</div>
              <div className="font-medium">{new Date(viewingBlock.endTime).toLocaleString()}</div>
            </div>
            <div className="text-sm md:col-span-2">
              <div className="text-xs uppercase tracking-wide text-slate-400">Recurso</div>
              <div className="font-medium">
                {resources.find((resource) => resource._id === viewingBlock.resourceId)?.name ||
                  viewingBlock.resourceId ||
                  "Todos"}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {deletingBlock && (
        <ConfirmDeleteModal
          open={Boolean(deletingBlock)}
          title="Eliminar bloqueo"
          description="Esta accion no se puede deshacer."
          itemLabel={deletingBlock.reason || "este bloqueo"}
          onClose={() => setDeletingBlock(null)}
          onConfirm={() => {
            deleteBlock(deletingBlock._id);
            setDeletingBlock(null);
          }}
        />
      )}
    </section>
  );
}
