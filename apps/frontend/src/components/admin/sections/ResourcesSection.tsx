import React from "react";
import { ResourceItem } from "../types";
import { InputField } from "../components/InputField";
import { ResourceEditor } from "../components/ResourceEditor";

export function ResourcesSection({
  resources,
  editingResourceId,
  setEditingResourceId,
  createResource,
  updateResource,
  deleteResource,
  loadResources
}: {
  resources: ResourceItem[];
  editingResourceId: string | null;
  setEditingResourceId: (value: string | null) => void;
  createResource: (event: React.FormEvent<HTMLFormElement>) => void;
  updateResource: (resourceId: string, payload: Partial<ResourceItem>) => void;
  deleteResource: (resourceId: string) => void;
  loadResources: () => void;
}) {
  return (
    <section className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recursos</h3>
        <button className="text-xs text-slate-500" onClick={() => void loadResources()}>
          Refrescar
        </button>
      </div>
      <form className="mt-4 flex flex-wrap gap-3" onSubmit={createResource}>
        <InputField name="name" label="Nombre" className="flex-1" />
        <button className="rounded-xl bg-primary-600 px-4 py-2 text-white" type="submit">
          Crear recurso
        </button>
      </form>
      <div className="mt-6 space-y-2">
        {resources.map((resource) => (
          <div key={resource._id} className="card-muted p-3">
            {editingResourceId === resource._id ? (
              <ResourceEditor
                item={resource}
                onCancel={() => setEditingResourceId(null)}
                onSave={(payload) => updateResource(resource._id, payload)}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{resource.name}</p>
                  <p className="text-xs text-slate-500">
                    {resource.active ? "Activo" : "Inactivo"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                    onClick={() => setEditingResourceId(resource._id)}
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-xl border border-slate-200 px-3 py-1 text-xs"
                    onClick={() => deleteResource(resource._id)}
                  >
                    Desactivar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {resources.length === 0 && (
          <p className="text-sm text-slate-500">No hay recursos creados.</p>
        )}
      </div>
    </section>
  );
}
