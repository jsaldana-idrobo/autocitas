import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../../lib/api";
import type { AvailabilitySlot, BusinessResponse } from "./types";
import {
  DEFAULT_TIMEZONE,
  PHONE_MIN_LEN,
  findResourceIdByIdentifier,
  getTodayInTimezone,
  normalizePhone
} from "./utils";
import { useBookingManage } from "./useBookingManage";

export function useBookingState(slug: string, resourceIdentifier?: string) {
  const [loading, setLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [resourceId, setResourceId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const availabilityRequestIdRef = useRef(0);
  const fireAndForget = useCallback((promise: Promise<unknown>) => {
    promise.catch(() => {});
  }, []);

  const normalizedPhone = normalizePhone(customerPhone);
  const timezone = business?.business.timezone || DEFAULT_TIMEZONE;

  const service = useMemo(
    () => business?.services.find((item) => item._id === serviceId) ?? null,
    [business, serviceId]
  );

  // UX: always force selecting a professional before showing availability / enabling booking.
  const isResourceRequired = true;

  const canSubmit =
    !!serviceId &&
    !!selectedSlot &&
    customerName.trim().length > 0 &&
    normalizedPhone.length >= PHONE_MIN_LEN &&
    (!isResourceRequired || !!resourceId);

  const availableResources = useMemo(() => {
    if (!business) return [];
    if (!service?.allowedResourceIds?.length) {
      return business.resources;
    }
    return business.resources.filter((resource) =>
      service.allowedResourceIds?.includes(resource._id)
    );
  }, [business, service]);

  const loadAvailability = useCallback(
    async (selectedDate: string, selectedService: string, selectedResource?: string) => {
      if (!selectedDate || !selectedService) return;
      const requestId = ++availabilityRequestIdRef.current;
      setAvailabilityLoading(true);
      setError(null);
      setSlots([]);
      setSelectedSlot(null);
      try {
        const resourceQuery = selectedResource ? `&resourceId=${selectedResource}` : "";
        const data = await apiRequest<{ slots: AvailabilitySlot[] }>(
          `/public/businesses/${slug}/availability?date=${selectedDate}&serviceId=${selectedService}${resourceQuery}`
        );
        if (requestId !== availabilityRequestIdRef.current) return;
        setSlots(data.slots);
      } catch (err) {
        if (requestId !== availabilityRequestIdRef.current) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar disponibilidad");
      } finally {
        if (requestId === availabilityRequestIdRef.current) {
          setAvailabilityLoading(false);
        }
      }
    },
    [slug]
  );

  useEffect(() => {
    async function loadBusiness() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<BusinessResponse>(`/public/businesses/${slug}`);
        setBusiness(data);

        let defaultServiceId = data.services[0]?._id ?? "";
        let defaultResourceId = findResourceIdByIdentifier(data.resources, resourceIdentifier);

        if (defaultResourceId) {
          const serviceForResource = data.services.find((item) => {
            if (!item.allowedResourceIds?.length) {
              return true;
            }
            return item.allowedResourceIds.includes(defaultResourceId);
          });

          if (serviceForResource) {
            defaultServiceId = serviceForResource._id;
          } else {
            defaultResourceId = "";
          }
        }

        setServiceId(defaultServiceId);
        setResourceId(defaultResourceId);
        const today = getTodayInTimezone(data.business.timezone || DEFAULT_TIMEZONE);
        setDate(today);
        if (defaultServiceId) {
          if (defaultResourceId) {
            fireAndForget(loadAvailability(today, defaultServiceId, defaultResourceId));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el negocio");
      } finally {
        setLoading(false);
      }
    }

    fireAndForget(loadBusiness());
  }, [fireAndForget, loadAvailability, resourceIdentifier, slug]);

  async function handleBooking() {
    if (!serviceId || !selectedSlot || !customerName.trim() || !normalizedPhone) {
      setError("Completa todos los datos antes de reservar.");
      return;
    }
    if (normalizedPhone.length < PHONE_MIN_LEN) {
      setError("Ingresa un telefono valido.");
      return;
    }
    if (isResourceRequired && !resourceId) {
      setError("Selecciona un profesional antes de reservar.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<{ appointmentId: string }>(
        `/public/businesses/${slug}/appointments`,
        {
          method: "POST",
          body: JSON.stringify({
            serviceId,
            resourceId: resourceId || undefined,
            startTime: selectedSlot,
            customerName,
            customerPhone: normalizedPhone
          })
        }
      );
      setConfirmation(`Reserva creada: ${response.appointmentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cita");
    } finally {
      setLoading(false);
    }
  }

  const handleServiceChange = (nextService: string) => {
    setServiceId(nextService);
    setSelectedSlot(null);
    const nextServiceData = business?.services.find((item) => item._id === nextService);
    const nextResourceId =
      resourceId &&
      (!nextServiceData?.allowedResourceIds?.length ||
        nextServiceData.allowedResourceIds.includes(resourceId))
        ? resourceId
        : "";
    setResourceId(nextResourceId);
    if (date) {
      if (nextResourceId) {
        fireAndForget(loadAvailability(date, nextService, nextResourceId));
      } else {
        setSlots([]);
        setSelectedSlot(null);
      }
    }
  };

  const handleDateChange = (value: string) => {
    setDate(value);
    if (resourceId) {
      fireAndForget(loadAvailability(value, serviceId, resourceId));
      return;
    }
    setSlots([]);
    setSelectedSlot(null);
  };

  const handleResourceChange = (value: string) => {
    setResourceId(value);
    if (date) {
      if (value) {
        fireAndForget(loadAvailability(date, serviceId, value));
        return;
      }
      setSlots([]);
      setSelectedSlot(null);
    }
  };

  const manageState = useBookingManage({ slug, timezone, loading, setLoading });

  return {
    loading,
    error,
    business,
    serviceId,
    date,
    slots,
    selectedSlot,
    resourceId,
    customerName,
    customerPhone,
    confirmation,
    canSubmit,
    availabilityLoading,
    timezone,
    service,
    availableResources,
    setCustomerName,
    setCustomerPhone,
    setSelectedSlot,
    handleBooking,
    handleServiceChange,
    handleDateChange,
    handleResourceChange,
    fireAndForget,
    ...manageState
  };
}
