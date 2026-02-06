import { useCallback, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";
import type { AppointmentItem } from "./types";
import { DISABLED_OPACITY, PHONE_MIN_LEN, normalizePhone, toDateTimeLocalValue } from "./utils";

type ManageState = {
  manageOpen: boolean;
  manageSearchPhone: string;
  manageResults: AppointmentItem[];
  manageSelected: AppointmentItem | null;
  manageName: string;
  managePhone: string;
  manageStartTime: string;
  manageMessage: string | null;
};

type ManageDerived = {
  canSearch: boolean;
  canUpdate: boolean;
  canCancel: boolean;
  searchOpacityClass: string;
  updateOpacityClass: string;
  cancelOpacityClass: string;
};

type ManageActions = {
  setManageSearchPhone: (value: string) => void;
  setManageSelected: (value: AppointmentItem | null) => void;
  setManageName: (value: string) => void;
  setManagePhone: (value: string) => void;
  setManageStartTime: (value: string) => void;
  setManageOpen: (value: boolean) => void;
  setManageMessage: (value: string | null) => void;
  handleSearchAppointments: () => Promise<void>;
  handleUpdateAppointment: () => Promise<void>;
  handleCancelAppointment: () => Promise<void>;
  handleOpenManage: () => void;
};

type ManageDeps = {
  slug: string;
  timezone: string;
  loading: boolean;
  setLoading: (value: boolean) => void;
};

export function useBookingManage({ slug, timezone, loading, setLoading }: ManageDeps) {
  const [manageOpen, setManageOpen] = useState(false);
  const [manageSearchPhone, setManageSearchPhone] = useState("");
  const [manageResults, setManageResults] = useState<AppointmentItem[]>([]);
  const [manageSelected, setManageSelected] = useState<AppointmentItem | null>(null);
  const [manageName, setManageName] = useState("");
  const [managePhone, setManagePhone] = useState("");
  const [manageStartTime, setManageStartTime] = useState("");
  const [manageMessage, setManageMessage] = useState<string | null>(null);

  const normalizedManagePhone = useMemo(
    () => normalizePhone(manageSearchPhone),
    [manageSearchPhone]
  );
  const normalizedManageEditPhone = useMemo(() => normalizePhone(managePhone), [managePhone]);
  const originalStartLocal = manageSelected
    ? toDateTimeLocalValue(manageSelected.startTime, timezone)
    : "";
  const nameChanged = useMemo(
    () => !!manageSelected && manageName.trim() !== (manageSelected.customerName || ""),
    [manageName, manageSelected]
  );
  const phoneChanged = useMemo(
    () =>
      !!manageSelected &&
      normalizedManageEditPhone !== normalizePhone(manageSelected.customerPhone),
    [manageSelected, normalizedManageEditPhone]
  );
  const phoneValid = normalizedManageEditPhone.length >= PHONE_MIN_LEN;
  const timeChanged = !!manageSelected && manageStartTime !== originalStartLocal;
  const canSearch = normalizedManagePhone.length >= PHONE_MIN_LEN && !loading;
  const canUpdate =
    Boolean(manageSelected) &&
    normalizedManagePhone.length >= PHONE_MIN_LEN &&
    !loading &&
    (nameChanged || timeChanged || (phoneChanged && phoneValid));
  const canCancel = Boolean(manageSelected) && normalizedManagePhone.length >= PHONE_MIN_LEN;
  const searchOpacityClass = canSearch ? "" : DISABLED_OPACITY;
  const updateOpacityClass = canUpdate ? "" : DISABLED_OPACITY;
  const cancelOpacityClass = canCancel ? "" : DISABLED_OPACITY;

  const handleSearchAppointments = useCallback(async () => {
    if (normalizedManagePhone.length < PHONE_MIN_LEN) {
      setManageMessage("Ingresa un telefono valido.");
      return;
    }
    setLoading(true);
    setManageMessage(null);
    try {
      const data = await apiRequest<{ appointments: AppointmentItem[] }>(
        `/public/businesses/${slug}/appointments?phone=${encodeURIComponent(normalizedManagePhone)}`
      );
      setManageResults(data.appointments);
      if (manageSelected) {
        const refreshed = data.appointments.find((item) => item._id === manageSelected._id) ?? null;
        setManageSelected(refreshed);
        if (refreshed) {
          setManageName(refreshed.customerName);
          setManagePhone(refreshed.customerPhone);
          setManageStartTime(toDateTimeLocalValue(refreshed.startTime, timezone));
        }
      }
      if (data.appointments.length === 0) {
        setManageMessage("No encontramos citas con ese telefono.");
      }
    } catch (err) {
      setManageMessage(err instanceof Error ? err.message : "No se pudo buscar la cita");
    } finally {
      setLoading(false);
    }
  }, [manageSelected, normalizedManagePhone, setLoading, slug, timezone]);

  const handleUpdateAppointment = useCallback(async () => {
    if (!manageSelected || normalizedManagePhone.length < PHONE_MIN_LEN) {
      setManageMessage("Selecciona una cita y confirma tu telefono.");
      return;
    }
    if (!nameChanged && !phoneChanged && !timeChanged) {
      setManageMessage("No hay cambios para guardar.");
      return;
    }
    if (phoneChanged && normalizedManageEditPhone.length < PHONE_MIN_LEN) {
      setManageMessage("Ingresa un telefono valido para actualizarlo.");
      return;
    }
    setLoading(true);
    setManageMessage(null);
    try {
      await apiRequest(`/public/businesses/${slug}/appointments/${manageSelected._id}/update`, {
        method: "POST",
        body: JSON.stringify({
          customerPhone: normalizedManagePhone,
          customerName: nameChanged ? manageName : undefined,
          newCustomerPhone: phoneChanged ? normalizedManageEditPhone : undefined,
          startTime: timeChanged ? manageStartTime : undefined
        })
      });
      setManageMessage("Cita actualizada correctamente.");
      await handleSearchAppointments();
    } catch (err) {
      setManageMessage(err instanceof Error ? err.message : "No se pudo actualizar la cita");
    } finally {
      setLoading(false);
    }
  }, [
    handleSearchAppointments,
    manageName,
    manageSelected,
    manageStartTime,
    nameChanged,
    normalizedManageEditPhone,
    normalizedManagePhone,
    phoneChanged,
    setLoading,
    slug,
    timeChanged
  ]);

  const handleCancelAppointment = useCallback(async () => {
    if (!manageSelected || normalizedManagePhone.length < PHONE_MIN_LEN) {
      setManageMessage("Selecciona una cita y confirma tu telefono.");
      return;
    }
    setLoading(true);
    setManageMessage(null);
    try {
      await apiRequest(`/public/businesses/${slug}/appointments/${manageSelected._id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ customerPhone: normalizedManagePhone })
      });
      setManageMessage("Cita cancelada correctamente.");
      await handleSearchAppointments();
    } catch (err) {
      setManageMessage(err instanceof Error ? err.message : "No se pudo cancelar la cita");
    } finally {
      setLoading(false);
    }
  }, [handleSearchAppointments, manageSelected, normalizedManagePhone, setLoading, slug]);

  const handleOpenManage = () => {
    setManageOpen(true);
    setManageResults([]);
    setManageSelected(null);
    setManageMessage(null);
  };

  return {
    manageOpen,
    manageSearchPhone,
    manageResults,
    manageSelected,
    manageName,
    managePhone,
    manageStartTime,
    manageMessage,
    canSearch,
    canUpdate,
    canCancel,
    searchOpacityClass,
    updateOpacityClass,
    cancelOpacityClass,
    setManageSearchPhone,
    setManageSelected,
    setManageName,
    setManagePhone,
    setManageStartTime,
    setManageOpen,
    setManageMessage,
    handleSearchAppointments,
    handleUpdateAppointment,
    handleCancelAppointment,
    handleOpenManage
  } satisfies ManageState & ManageDerived & ManageActions;
}
