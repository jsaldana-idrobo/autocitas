import React from "react";
import { BlockItem, ResourceItem } from "../types";
import { InputField } from "../components/InputField";
import { BlockEditor } from "../components/BlockEditor";

export function BlocksSection({
  blocks,
  resources,
  role,
  resourceId,
  editingBlockId,
  setEditingBlockId,
  createBlock,
  updateBlock,
  deleteBlock,
  loadBlocks
}: {
  blocks: BlockItem[];
  resources: ResourceItem[];
  role: "owner" | "staff" | "platform_admin" | "unknown";
  resourceId?: string;
  editingBlockId: string | null;
  setEditingBlockId: (value: string | null) => void;
  createBlock: (event: React.FormEvent<HTMLFormElement>) => void;
  updateBlock: (blockId: string, payload: Partial<BlockItem>) => void;
  deleteBlock: (blockId: string) => void;
  loadBlocks: () => void;
}) {
  return (
    <section className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bloqueos</h3>
        <button className="text-xs text-slate-500" onClick={() => void loadBlocks()}>
          Refrescar
        </button>
      </div>
      <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={createBlock}>
        <InputField name="startTime" label="Inicio" type="datetime-local" />
        <InputField name="endTime" label="Fin" type="datetime-local" />
        {role === "staff" ? (
          <div className="card-muted flex items-center px-3 py-2 text-sm text-slate-500">
            Bloqueo asignado a tu recurso
            <input type="hidden" name="resourceId" value={resourceId ?? ""} />
          </div>
        ) : (
          <label className="block text-sm font-medium">
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
        <button
          className="rounded-xl bg-primary-600 px-4 py-2 text-white md:col-span-4"
          type="submit"
        >
          Crear bloqueo
        </button>
      </form>
      <div className="mt-6 space-y-2">
        {blocks.map((block) => (
          <div key={block._id} className="card-muted p-3">
            {editingBlockId === block._id ? (
              <BlockEditor
                item={block}
                resources={resources}
                canEditResource={role !== "staff"}
                onCancel={() => setEditingBlockId(null)}
                onSave={(payload) => updateBlock(block._id, payload)}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{block.reason || "Bloqueo"}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(block.startTime).toLocaleString()} -{" "}
                    {new Date(block.endTime).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                    onClick={() => setEditingBlockId(block._id)}
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                    onClick={() => deleteBlock(block._id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {blocks.length === 0 && (
          <p className="text-sm text-slate-500">No hay bloqueos registrados.</p>
        )}
      </div>
    </section>
  );
}
