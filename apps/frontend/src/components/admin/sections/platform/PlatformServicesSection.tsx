import React, { useEffect, useMemo, useState } from "react";
import { BusinessProfile, ResourceItem, ServiceItem } from "../../types";
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
import { Pagination } from "../../ui/Pagination";
import { SectionHeader } from "../../ui/SectionHeader";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { BusinessSearchSelect } from "../../components/BusinessSearchSelect";

export function PlatformServicesSection({
  services,
  resources,
  businesses,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
  total,
  authHeaders
}: Readonly<{
  services: ServiceItem[];
  resources: ResourceItem[];
  businesses: BusinessProfile[];
  onRefresh: (options?: {
    page?: number;
    limit?: number;
    search?: string;
    active?: string;
    businessId?: string;
    minDuration?: string;
    maxDuration?: string;
    minPrice?: string;
    maxPrice?: string;
  }) => void;
  onCreate: (
    businessId: string,
    payload: { name: string; durationMinutes: number; price?: number }
  ) => void;
  onUpdate: (businessId: string, serviceId: string, payload: Partial<ServiceItem>) => void;
  onDelete: (businessId: string, serviceId: string) => void;
  total: number;
  authHeaders: { token: string };
}>) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [businessFilter, setBusinessFilter] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [durationMax, setDurationMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [deletingService, setDeletingService] = useState<ServiceItem | null>(null);
  const [viewingService, setViewingService] = useState<ServiceItem | null>(null);
  const [createBusinessId, setCreateBusinessId] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);

  const businessLookup = useMemo(() => {
    return new Map(businesses.map((business) => [business._id ?? "", business.name ?? ""]));
  }, [businesses]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, businessFilter, durationMin, durationMax, priceMin, priceMax]);

  useEffect(() => {
    onRefresh({
      page,
      limit: pageSize,
      search: debouncedSearch,
      active: statusFilter,
      businessId: businessFilter,
      minDuration: durationMin,
      maxDuration: durationMax,
      minPrice: priceMin,
      maxPrice: priceMax
    });
  }, [
    page,
    pageSize,
    debouncedSearch,
    statusFilter,
    businessFilter,
    durationMin,
    durationMax,
    priceMin,
    priceMax,
    onRefresh
  ]);

  function getResourcesForService(service: ServiceItem) {
    if (!service.businessId) return [];
    return resources.filter((resource) => resource.businessId === service.businessId);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <SectionHeader
        title="Servicios"
        subtitle="Administra los servicios de todos los negocios."
        actions={
          <>
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onClick={() =>
                onRefresh({
                  page,
                  limit: pageSize,
                  search,
                  active: statusFilter,
                  businessId: businessFilter,
                  minDuration: durationMin,
                  maxDuration: durationMax,
                  minPrice: priceMin,
                  maxPrice: priceMax
                })
              }
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
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={businessFilter}
          onChange={(event) => setBusinessFilter(event.target.value)}
        >
          <option value="">Todos los negocios</option>
          {businesses.map((business) => (
            <option key={business._id} value={business._id}>
              {business.name ?? business._id}
            </option>
          ))}
        </select>
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          type="number"
          placeholder="Duracion min"
          value={durationMin}
          onChange={(event) => setDurationMin(event.target.value)}
        />
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          type="number"
          placeholder="Duracion max"
          value={durationMax}
          onChange={(event) => setDurationMax(event.target.value)}
        />
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          type="number"
          placeholder="Precio min"
          value={priceMin}
          onChange={(event) => setPriceMin(event.target.value)}
        />
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          type="number"
          placeholder="Precio max"
          value={priceMax}
          onChange={(event) => setPriceMax(event.target.value)}
        />
      </div>

      <div className="mt-4">
        <DataTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Negocio</TableHeaderCell>
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
                <TableCell>
                  {service.businessId
                    ? businessLookup.get(service.businessId) || service.businessId
                    : "-"}
                </TableCell>
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
                      onClick={() => setViewingService(service)}
                    >
                      Ver
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => setEditingService(service)}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => {
                        if (!service.businessId) return;
                        onUpdate(service.businessId, service._id, { active: !service.active });
                      }}
                    >
                      {service.active ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                      onClick={() => setDeletingService(service)}
                    >
                      Eliminar
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {services.length === 0 && (
              <TableRow>
                <TableCell className="text-slate-500" colSpan={6}>
                  No hay servicios para los filtros actuales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </DataTable>
      </div>

      <Pagination
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setPage(1);
        }}
      />

      <Modal open={createOpen} title="Nuevo servicio" onClose={() => setCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const readString = (key: string) => {
              const value = form.get(key);
              return typeof value === "string" ? value.trim() : "";
            };
            const name = readString("name");
            const durationMinutes = Number(readString("durationMinutes"));
            const priceRaw = readString("price");
            const price = priceRaw ? Number(priceRaw) : undefined;
            if (!createBusinessId || !name || !durationMinutes) {
              return;
            }
            onCreate(createBusinessId, { name, durationMinutes, price });
            event.currentTarget.reset();
            setCreateBusinessId("");
            setCreateOpen(false);
          }}
        >
          <BusinessSearchSelect
            className="md:col-span-2"
            value={createBusinessId}
            onChange={setCreateBusinessId}
            authHeaders={authHeaders}
            initialOptions={businesses}
            selectedLabel={businessLookup.get(createBusinessId)}
            required
          />
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
              disabled={!createBusinessId}
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
            resources={getResourcesForService(editingService)}
            onCancel={() => setEditingService(null)}
            onSave={(payload) => {
              if (!editingService.businessId) return;
              onUpdate(editingService.businessId, editingService._id, payload);
              setEditingService(null);
            }}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(viewingService)}
        title="Detalle del servicio"
        onClose={() => setViewingService(null)}
      >
        {viewingService && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="text-sm md:col-span-2">
              <div className="text-xs uppercase tracking-wide text-slate-400">Negocio</div>
              <div className="font-medium">
                {viewingService.businessId
                  ? businessLookup.get(viewingService.businessId) || viewingService.businessId
                  : "-"}
              </div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Nombre</div>
              <div className="font-medium">{viewingService.name}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Duracion</div>
              <div className="font-medium">{viewingService.durationMinutes} min</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Precio</div>
              <div className="font-medium">${viewingService.price ?? "-"}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Estado</div>
              <div className="font-medium">{viewingService.active ? "Activo" : "Inactivo"}</div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                type="button"
                onClick={() => setViewingService(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deletingService)}
        title="Eliminar servicio"
        description="Esta accion no se puede deshacer."
        onClose={() => setDeletingService(null)}
      >
        {deletingService && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Vas a eliminar <strong>{deletingService.name}</strong>.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                type="button"
                onClick={() => setDeletingService(null)}
              >
                Cancelar
              </button>
              <button
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm text-white"
                type="button"
                onClick={() => {
                  if (!deletingService.businessId) return;
                  onDelete(deletingService.businessId, deletingService._id);
                  setDeletingService(null);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
