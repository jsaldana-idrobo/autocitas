import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../../lib/api";
import { BusinessProfile, PaginatedResponse } from "../types";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

export function BusinessSearchSelect({
  value,
  onChange,
  authHeaders,
  label = "Negocio",
  placeholder = "Busca por nombre o slug",
  name = "businessId",
  required,
  initialOptions,
  selectedLabel,
  className
}: {
  value: string;
  onChange: (value: string) => void;
  authHeaders: { token: string };
  label?: string;
  placeholder?: string;
  name?: string;
  required?: boolean;
  initialOptions?: BusinessProfile[];
  selectedLabel?: string;
  className?: string;
}) {
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<BusinessProfile[]>(initialOptions ?? []);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);

  useEffect(() => {
    if (initialOptions && initialOptions.length > 0) {
      setOptions(initialOptions);
    }
  }, [initialOptions]);

  useEffect(() => {
    const term = debouncedSearch.trim();
    if (term.length < 2) {
      if (initialOptions && initialOptions.length > 0) {
        setOptions(initialOptions);
      } else {
        setOptions([]);
      }
      return;
    }
    let active = true;
    setLoading(true);
    apiRequest<PaginatedResponse<BusinessProfile>>(
      `/admin/platform/businesses?search=${encodeURIComponent(term)}&page=1&limit=20`,
      authHeaders
    )
      .then((data) => {
        if (!active) return;
        setOptions(data.items);
      })
      .catch(() => {
        if (!active) return;
        setOptions([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authHeaders, debouncedSearch, initialOptions]);

  const selectedOption = useMemo(() => {
    if (!value) return null;
    const found = options.find((item) => item._id === value);
    if (found) return found;
    if (selectedLabel) {
      return { _id: value, name: selectedLabel } as BusinessProfile;
    }
    return { _id: value, name: value } as BusinessProfile;
  }, [options, selectedLabel, value]);

  return (
    <div className={className}>
      <label className="block text-sm font-medium">
        {label}
        <input
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          placeholder={placeholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <select
        name={name}
        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        <option value="">Selecciona un negocio</option>
        {selectedOption && !options.some((item) => item._id === selectedOption._id) && (
          <option value={selectedOption._id}>{selectedOption.name ?? selectedOption._id}</option>
        )}
        {options.map((business) => (
          <option key={business._id} value={business._id}>
            {business.name ?? business._id}
          </option>
        ))}
      </select>
      {loading && <div className="mt-1 text-xs text-slate-500">Buscando negocios...</div>}
    </div>
  );
}
