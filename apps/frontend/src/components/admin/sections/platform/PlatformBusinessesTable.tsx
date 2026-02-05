import React, { useMemo, useState } from "react";
import { BusinessProfile } from "../../types";
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
import { PlatformEditBusinessForm } from "./PlatformEditBusinessForm";

export function PlatformBusinessesTable({
  businesses,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete
}: {
  businesses: BusinessProfile[];
  onRefresh: () => void;
  onCreate: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdate: (businessId: string, payload: Partial<BusinessProfile>) => void;
  onDelete: (businessId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessProfile | null>(null);
  const [viewingBusiness, setViewingBusiness] = useState<BusinessProfile | null>(null);
  const [deletingBusiness, setDeletingBusiness] = useState<BusinessProfile | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return businesses.filter((business) => {
      const matchesSearch =
        !term ||
        (business.name || "").toLowerCase().includes(term) ||
        (business.slug || "").toLowerCase().includes(term);
      const matchesStatus = !statusFilter || business.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [businesses, search, statusFilter]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <SectionHeader
        title="Negocios"
        subtitle="Gestiona los negocios de la plataforma."
        actions={
          <>
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onClick={onRefresh}
            >
              Refrescar
            </button>
            <button
              className="rounded-xl bg-primary-600 px-3 py-2 text-sm text-white"
              onClick={() => setCreateOpen(true)}
            >
              Nuevo negocio
            </button>
          </>
        }
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Buscar por nombre o slug"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">Todos</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>

      <div className="mt-4">
        <DataTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Negocio</TableHeaderCell>
              <TableHeaderCell>Slug</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((business) => (
              <TableRow key={business._id}>
                <TableCell>
                  <div className="font-medium">{business.name}</div>
                  <div className="text-xs text-slate-500">
                    {business.timezone || "America/Bogota"}
                  </div>
                </TableCell>
                <TableCell>{business.slug}</TableCell>
                <TableCell>
                  <Badge tone={business.status === "active" ? "success" : "warning"}>
                    {business.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => setViewingBusiness(business)}
                    >
                      Ver
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => setEditingBusiness(business)}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                      onClick={() => setDeletingBusiness(business)}
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
                  No hay negocios para los filtros actuales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </DataTable>
      </div>

      <Modal
        open={createOpen}
        title="Nuevo negocio"
        description="Completa los datos del negocio."
        onClose={() => setCreateOpen(false)}
      >
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            onCreate(event);
            setCreateOpen(false);
          }}
        >
          <InputField name="name" label="Nombre" />
          <InputField name="slug" label="Slug" />
          <InputField name="timezone" label="Zona horaria" />
          <InputField name="contactPhone" label="Telefono" />
          <InputField name="address" label="Direccion" />
          <label className="block text-sm font-medium">
            Estado
            <select
              name="status"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </label>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
              type="button"
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
        open={Boolean(editingBusiness)}
        title="Editar negocio"
        onClose={() => setEditingBusiness(null)}
      >
        {editingBusiness && (
          <PlatformEditBusinessForm
            business={editingBusiness}
            onCancel={() => setEditingBusiness(null)}
            onSave={(payload) => {
              if (!editingBusiness._id) return;
              onUpdate(editingBusiness._id, payload);
              setEditingBusiness(null);
            }}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(viewingBusiness)}
        title="Detalle del negocio"
        onClose={() => setViewingBusiness(null)}
      >
        {viewingBusiness && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Nombre</div>
              <div className="font-medium">{viewingBusiness.name || "-"}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Slug</div>
              <div className="font-medium">{viewingBusiness.slug || "-"}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Zona horaria</div>
              <div className="font-medium">{viewingBusiness.timezone || "America/Bogota"}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Telefono</div>
              <div className="font-medium">{viewingBusiness.contactPhone || "-"}</div>
            </div>
            <div className="text-sm md:col-span-2">
              <div className="text-xs uppercase tracking-wide text-slate-400">Direccion</div>
              <div className="font-medium">{viewingBusiness.address || "-"}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Estado</div>
              <div className="font-medium">
                {viewingBusiness.status === "active" ? "Activo" : "Inactivo"}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                type="button"
                onClick={() => setViewingBusiness(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deletingBusiness)}
        title="Eliminar negocio"
        description="Esta accion no se puede deshacer."
        onClose={() => setDeletingBusiness(null)}
      >
        {deletingBusiness && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Vas a eliminar <strong>{deletingBusiness.name || "este negocio"}</strong>.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                type="button"
                onClick={() => setDeletingBusiness(null)}
              >
                Cancelar
              </button>
              <button
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm text-white"
                type="button"
                onClick={() => {
                  if (deletingBusiness._id) {
                    onDelete(deletingBusiness._id);
                  }
                  setDeletingBusiness(null);
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
