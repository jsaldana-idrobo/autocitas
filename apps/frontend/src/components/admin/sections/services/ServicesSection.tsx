import React, { useMemo, useState } from "react";
import { ResourceItem, ServiceItem } from "../../types";
import { ServiceEditor } from "../../components/ServiceEditor";
import { InputField } from "../../components/InputField";
import { Badge } from "../../ui/Badge";
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

export function ServicesSection({
  services,
  resources,
  createService,
  updateService,
  deleteService,
  loadServices,
  ensureResourcesLoaded
}: {
  services: ServiceItem[];
  resources: ResourceItem[];
  createService: (event: React.FormEvent<HTMLFormElement>) => void;
  updateService: (serviceId: string, payload: Partial<ServiceItem>) => void;
  deleteService: (serviceId: string) => void;
  loadServices: () => void;
  ensureResourcesLoaded: () => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return services.filter((service) => {
      const matchesSearch = !term || service.name.toLowerCase().includes(term);
      const matchesStatus =
        !statusFilter || (statusFilter === "active" ? service.active : !service.active);
      return matchesSearch && matchesStatus;
    });
  }, [services, search, statusFilter]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <SectionHeader
        title="Servicios"
        subtitle="Crea y administra los servicios de tu negocio."
        actions={
          <>
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onClick={loadServices}
            >
              Refrescar
            </button>
            <button
              className="rounded-xl bg-primary-600 px-3 py-2 text-sm text-white"
              onClick={() => setCreateOpen(true)}
            >
              Nuevo servicio
            </button>
          </>
        }
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Buscar por nombre"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      <div className="mt-4">
        <DataTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Servicio</TableHeaderCell>
              <TableHeaderCell>Duracion</TableHeaderCell>
              <TableHeaderCell>Precio</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((service) => (
              <TableRow key={service._id}>
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
                      onClick={() => {
                        ensureResourcesLoaded();
                        setEditingService(service);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => updateService(service._id, { active: !service.active })}
                    >
                      {service.active ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                      onClick={() => deleteService(service._id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell className="text-slate-500" colSpan={5}>
                  No hay servicios para los filtros actuales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </DataTable>
      </div>

      <Modal open={createOpen} title="Nuevo servicio" onClose={() => setCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            createService(event);
            setCreateOpen(false);
          }}
        >
          <InputField name="name" label="Nombre" placeholder="Corte clasico" />
          <InputField name="durationMinutes" label="Duracion (min)" type="number" />
          <InputField name="price" label="Precio" type="number" />
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
        open={Boolean(editingService)}
        title="Editar servicio"
        onClose={() => setEditingService(null)}
      >
        {editingService && (
          <ServiceEditor
            item={editingService}
            resources={resources}
            onCancel={() => setEditingService(null)}
            onSave={(payload) => {
              updateService(editingService._id, payload);
              setEditingService(null);
            }}
          />
        )}
      </Modal>
    </section>
  );
}
