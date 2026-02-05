import { useCallback, useRef, useState, type FormEvent } from "react";
import { apiRequest } from "../../../lib/api";
import { BusinessHoursItem, BusinessProfile, Policies, dayLabels } from "../types";
import { AdminApiContext } from "./types";

type BusinessStatus = "active" | "inactive";

export function useAdminBusinessSettings(api: AdminApiContext) {
  const [hours, setHours] = useState<BusinessHoursItem[]>([]);
  const [policies, setPolicies] = useState<Policies | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({});
  const [businessLoaded, setBusinessLoaded] = useState(false);
  const isLoadingRef = useRef(false);

  function startLoad() {
    if (isLoadingRef.current) return false;
    isLoadingRef.current = true;
    return true;
  }

  function endLoad() {
    isLoadingRef.current = false;
  }

  async function loadBusinessSettings() {
    if (!startLoad()) return;
    api.setLoading(true);
    api.resetError();
    api.resetSuccess();
    try {
      const [businessData, policiesData, hoursData] = await Promise.all([
        apiRequest<BusinessProfile>(`/admin/businesses/${api.businessId}`, api.authHeaders),
        apiRequest<Policies>(`/admin/businesses/${api.businessId}/policies`, api.authHeaders),
        apiRequest<BusinessHoursItem[]>(
          `/admin/businesses/${api.businessId}/hours`,
          api.authHeaders
        )
      ]);
      setBusinessProfile(businessData);
      setPolicies(policiesData);
      setHours(hoursData);
      setBusinessLoaded(true);
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error cargando configuracion");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function saveHours(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
    api.resetSuccess();
    const form = new FormData(event.currentTarget);
    const readString = (key: string) => {
      const value = form.get(key);
      return typeof value === "string" ? value.trim() : "";
    };
    let payloadHours: { dayOfWeek: number; openTime: string; closeTime: string }[] = [];
    try {
      payloadHours = dayLabels
        .map((_, index) => {
          const openTime = readString(`open-${index}`);
          const closeTime = readString(`close-${index}`);
          if (!openTime && !closeTime) {
            return null;
          }
          if (!openTime || !closeTime) {
            throw new Error(`Completa horario de ${dayLabels[index]}.`);
          }
          return { dayOfWeek: index, openTime, closeTime };
        })
        .filter((item): item is { dayOfWeek: number; openTime: string; closeTime: string } =>
          Boolean(item)
        );
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Horario invalido");
      return;
    }

    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/hours`, {
        method: "PATCH",
        body: JSON.stringify({ hours: payloadHours }),
        ...api.authHeaders
      });
      const [businessData, policiesData, hoursData] = await Promise.all([
        apiRequest<BusinessProfile>(`/admin/businesses/${api.businessId}`, api.authHeaders),
        apiRequest<Policies>(`/admin/businesses/${api.businessId}/policies`, api.authHeaders),
        apiRequest<BusinessHoursItem[]>(
          `/admin/businesses/${api.businessId}/hours`,
          api.authHeaders
        )
      ]);
      setBusinessProfile(businessData);
      setPolicies(policiesData);
      setHours(hoursData);
      setBusinessLoaded(true);
      api.setSuccess("Horarios actualizados.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error guardando horarios");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function savePolicies(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
    api.resetSuccess();
    const form = new FormData(event.currentTarget);
    const readString = (key: string) => {
      const value = form.get(key);
      return typeof value === "string" ? value.trim() : "";
    };
    const payload = {
      cancellationHours: Number(readString("cancellationHours")),
      rescheduleLimit: Number(readString("rescheduleLimit")),
      allowSameDay: readString("allowSameDay") === "true"
    };

    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/policies`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      const [businessData, policiesData, hoursData] = await Promise.all([
        apiRequest<BusinessProfile>(`/admin/businesses/${api.businessId}`, api.authHeaders),
        apiRequest<Policies>(`/admin/businesses/${api.businessId}/policies`, api.authHeaders),
        apiRequest<BusinessHoursItem[]>(
          `/admin/businesses/${api.businessId}/hours`,
          api.authHeaders
        )
      ]);
      setBusinessProfile(businessData);
      setPolicies(policiesData);
      setHours(hoursData);
      setBusinessLoaded(true);
      api.setSuccess("Politicas actualizadas.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error guardando politicas");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function saveBusinessProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
    api.resetSuccess();
    const form = new FormData(event.currentTarget);
    const readString = (key: string) => {
      const value = form.get(key);
      return typeof value === "string" ? value.trim() : "";
    };
    const payload = {
      name: readString("name") || undefined,
      slug: readString("slug") || undefined,
      timezone: readString("timezone") || undefined,
      contactPhone: readString("contactPhone") || undefined,
      address: readString("address") || undefined,
      status: (readString("status") as BusinessStatus) || undefined
    };

    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      const [businessData, policiesData, hoursData] = await Promise.all([
        apiRequest<BusinessProfile>(`/admin/businesses/${api.businessId}`, api.authHeaders),
        apiRequest<Policies>(`/admin/businesses/${api.businessId}/policies`, api.authHeaders),
        apiRequest<BusinessHoursItem[]>(
          `/admin/businesses/${api.businessId}/hours`,
          api.authHeaders
        )
      ]);
      setBusinessProfile(businessData);
      setPolicies(policiesData);
      setHours(hoursData);
      setBusinessLoaded(true);
      api.setSuccess("Negocio actualizado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error guardando negocio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  const resetLoaded = useCallback(() => {
    setBusinessLoaded(false);
  }, []);

  return {
    hours,
    policies,
    businessProfile,
    businessLoaded,
    loadBusinessSettings,
    saveHours,
    savePolicies,
    saveBusinessProfile,
    resetLoaded
  };
}
