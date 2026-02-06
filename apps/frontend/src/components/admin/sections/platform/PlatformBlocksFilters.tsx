import React from "react";
import { BusinessProfile, ResourceItem } from "../../types";

type PlatformBlocksFiltersProps = {
  search: string;
  setSearch: (value: string) => void;
  businessFilter: string;
  setBusinessFilter: (value: string) => void;
  resourceFilter: string;
  setResourceFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  fromFilter: string;
  setFromFilter: (value: string) => void;
  toFilter: string;
  setToFilter: (value: string) => void;
  businesses: BusinessProfile[];
  resources: ResourceItem[];
};

export function PlatformBlocksFilters({
  search,
  setSearch,
  businessFilter,
  setBusinessFilter,
  resourceFilter,
  setResourceFilter,
  typeFilter,
  setTypeFilter,
  fromFilter,
  setFromFilter,
  toFilter,
  setToFilter,
  businesses,
  resources
}: PlatformBlocksFiltersProps) {
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <input
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        placeholder="Buscar por motivo"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
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
      <select
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        value={resourceFilter}
        onChange={(event) => setResourceFilter(event.target.value)}
      >
        <option value="">Todos los recursos</option>
        {resources
          .filter((resource) => !businessFilter || resource.businessId === businessFilter)
          .map((resource) => (
            <option key={resource._id} value={resource._id}>
              {resource.name}
            </option>
          ))}
      </select>
      <select
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        value={typeFilter}
        onChange={(event) => setTypeFilter(event.target.value)}
      >
        <option value="">Todos</option>
        <option value="global">Global</option>
        <option value="resource">Recurso</option>
      </select>
      <InputFilter
        type="datetime-local"
        placeholder="Desde"
        value={fromFilter}
        onChange={setFromFilter}
      />
      <InputFilter
        type="datetime-local"
        placeholder="Hasta"
        value={toFilter}
        onChange={setToFilter}
      />
    </div>
  );
}

type InputFilterProps = {
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

function InputFilter({ type, placeholder, value, onChange }: InputFilterProps) {
  return (
    <input
      className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
