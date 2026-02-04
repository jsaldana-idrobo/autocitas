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
  onDelete,
  onSelectBusiness
}: {
  businesses: BusinessProfile[];
  onRefresh: () => void;
  onCreate: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdate: (businessId: string, payload: Partial<BusinessProfile>) => void;
  onDelete: (businessId: string) => void;
  onSelectBusiness: (businessId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessProfile | null>(null);

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
                      onClick={() => onSelectBusiness(String(business._id || ""))}
                    >
                      Usar
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => setEditingBusiness(business)}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                      onClick={() => business._id && onDelete(business._id)}
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
    </section>
  );
}
