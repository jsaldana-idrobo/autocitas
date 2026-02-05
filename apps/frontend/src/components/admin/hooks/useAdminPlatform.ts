import { useCallback, useRef, useState, type FormEvent } from "react";
import { apiRequest } from "../../../lib/api";
import {
  AppointmentItem,
  BlockItem,
  BusinessHoursItem,
  BusinessProfile,
  PaginatedResponse,
  PlatformUserUpdate,
  Policies,
  ResourceItem,
  ServiceItem,
  StaffItem
} from "../types";
import { toIsoIfPossible } from "../utils";
import { AdminApiContext } from "./types";

type StatusFilter = "" | "active" | "inactive";
type ActiveFilter = "" | "active" | "inactive";
type BlockTypeFilter = "" | "resource" | "global";

export function useAdminPlatform(api: AdminApiContext) {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [businessesTotal, setBusinessesTotal] = useState(0);
  const [businessesLoaded, setBusinessesLoaded] = useState(false);
  const [ownerBusinessId, setOwnerBusinessId] = useState("");
  const [platformOwners, setPlatformOwners] = useState<StaffItem[]>([]);
  const [platformStaff, setPlatformStaff] = useState<StaffItem[]>([]);
  const [platformOwnersTotal, setPlatformOwnersTotal] = useState(0);
  const [platformStaffTotal, setPlatformStaffTotal] = useState(0);
  const [platformAppointments, setPlatformAppointments] = useState<AppointmentItem[]>([]);
  const [platformAppointmentsTotal, setPlatformAppointmentsTotal] = useState(0);
  const [platformServices, setPlatformServices] = useState<ServiceItem[]>([]);
  const [platformResources, setPlatformResources] = useState<ResourceItem[]>([]);
  const [platformBlocks, setPlatformBlocks] = useState<BlockItem[]>([]);
  const [platformServicesTotal, setPlatformServicesTotal] = useState(0);
  const [platformResourcesTotal, setPlatformResourcesTotal] = useState(0);
  const [platformBlocksTotal, setPlatformBlocksTotal] = useState(0);
  const [platformAppointmentsDate, setPlatformAppointmentsDate] = useState("");
  const [platformAppointmentsStatus, setPlatformAppointmentsStatus] = useState("");
  const [platformAppointmentsSearch, setPlatformAppointmentsSearch] = useState("");
  const [platformOwnersLoaded, setPlatformOwnersLoaded] = useState(false);
  const [platformStaffLoaded, setPlatformStaffLoaded] = useState(false);
  const [platformAppointmentsLoaded, setPlatformAppointmentsLoaded] = useState(false);
  const [platformServicesLoaded, setPlatformServicesLoaded] = useState(false);
  const [platformResourcesLoaded, setPlatformResourcesLoaded] = useState(false);
  const [platformBlocksLoaded, setPlatformBlocksLoaded] = useState(false);
  const isLoadingRef = useRef(false);
  const businessesQueryRef = useRef({ page: 1, limit: 25, search: "", status: "" });
  const ownersQueryRef = useRef({ page: 1, limit: 25, search: "", active: "" });
  const staffQueryRef = useRef({ page: 1, limit: 25, search: "", active: "" });
  const appointmentsQueryRef = useRef({ page: 1, limit: 25 });
  const servicesQueryRef = useRef({
    page: 1,
    limit: 25,
    businessId: "",
    active: "",
    search: "",
    minDuration: "",
    maxDuration: "",
    minPrice: "",
    maxPrice: ""
  });
  const resourcesQueryRef = useRef({ page: 1, limit: 25, businessId: "", active: "", search: "" });
  const blocksQueryRef = useRef({
    page: 1,
    limit: 25,
    businessId: "",
    resourceId: "",
    search: "",
    type: "",
    from: "",
    to: ""
  });

  const startLoad = useCallback(() => {
    if (isLoadingRef.current) return false;
    isLoadingRef.current = true;
    return true;
  }, []);

  const endLoad = useCallback(() => {
    isLoadingRef.current = false;
  }, []);

  const readFormString = (form: FormData, key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value.trim() : "";
  };

  const loadBusinesses = useCallback(
    async (page = 1, limit = 25, search = "", status: StatusFilter = "") => {
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        businessesQueryRef.current = { page, limit, search, status };
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        const data = await apiRequest<PaginatedResponse<BusinessProfile>>(
          `/admin/platform/businesses?${params.toString()}`,
          api.authHeaders
        );
        setBusinesses(data.items);
        setBusinessesTotal(data.total);
        setBusinessesLoaded(true);
      } catch (err) {
        api.setError(err instanceof Error ? err.message : "Error cargando negocios");
      } finally {
        api.setLoading(false);
        endLoad();
      }
    },
    [api, endLoad, startLoad]
  );

  const loadPlatformOwners = useCallback(
    async (page = 1, limit = 25, search = "", active: ActiveFilter = "") => {
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        ownersQueryRef.current = { page, limit, search, active };
        const params = new URLSearchParams();
        params.set("role", "owner");
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (search) params.set("search", search);
        if (active) params.set("active", active === "active" ? "true" : "false");
        const data = await apiRequest<PaginatedResponse<StaffItem>>(
          `/admin/platform/users?${params.toString()}`,
          api.authHeaders
        );
        setPlatformOwners(data.items);
        setPlatformOwnersTotal(data.total);
        setPlatformOwnersLoaded(true);
      } catch (err) {
        api.setError(err instanceof Error ? err.message : "Error cargando owners");
      } finally {
        api.setLoading(false);
        endLoad();
      }
    },
    [api, endLoad, startLoad]
  );

  const loadPlatformStaff = useCallback(
    async (page = 1, limit = 25, search = "", active: ActiveFilter = "") => {
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        staffQueryRef.current = { page, limit, search, active };
        const params = new URLSearchParams();
        params.set("role", "staff");
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (search) params.set("search", search);
        if (active) params.set("active", active === "active" ? "true" : "false");
        const data = await apiRequest<PaginatedResponse<StaffItem>>(
          `/admin/platform/users?${params.toString()}`,
          api.authHeaders
        );
        setPlatformStaff(data.items);
        setPlatformStaffTotal(data.total);
        setPlatformStaffLoaded(true);
      } catch (err) {
        api.setError(err instanceof Error ? err.message : "Error cargando staff");
      } finally {
        api.setLoading(false);
        endLoad();
      }
    },
    [api, endLoad, startLoad]
  );

  const loadPlatformAppointments = useCallback(
    async (nextDate?: string, nextStatus?: string, nextSearch?: string, page = 1, limit = 25) => {
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        const params = new URLSearchParams();
        const dateValue = nextDate ?? platformAppointmentsDate;
        const statusValue = nextStatus ?? platformAppointmentsStatus;
        const searchValue = nextSearch ?? platformAppointmentsSearch;
        appointmentsQueryRef.current = { page, limit };
        if (dateValue) params.set("date", dateValue);
        if (statusValue) params.set("status", statusValue);
        if (searchValue) params.set("search", searchValue);
        params.set("page", String(page));
        params.set("limit", String(limit));
        const query = params.toString() ? `?${params.toString()}` : "";
        const data = await apiRequest<PaginatedResponse<AppointmentItem>>(
          `/admin/platform/appointments${query}`,
          api.authHeaders
        );
        setPlatformAppointments(data.items);
        setPlatformAppointmentsTotal(data.total);
        setPlatformAppointmentsLoaded(true);
      } catch (err) {
        api.setError(err instanceof Error ? err.message : "Error cargando citas globales");
      } finally {
        api.setLoading(false);
        endLoad();
      }
    },
    [
      api,
      endLoad,
      platformAppointmentsDate,
      platformAppointmentsSearch,
      platformAppointmentsStatus,
      startLoad
    ]
  );

  const loadPlatformServices = useCallback(
    async (
      options: {
        page?: number;
        limit?: number;
        search?: string;
        active?: ActiveFilter;
        businessId?: string;
        minDuration?: string;
        maxDuration?: string;
        minPrice?: string;
        maxPrice?: string;
      } = {}
    ) => {
      const {
        page = 1,
        limit = 25,
        search = "",
        active = "",
        businessId = "",
        minDuration = "",
        maxDuration = "",
        minPrice = "",
        maxPrice = ""
      } = options;
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        servicesQueryRef.current = {
          page,
          limit,
          search,
          active,
          businessId,
          minDuration,
          maxDuration,
          minPrice,
          maxPrice
        };
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (search) params.set("search", search);
        if (active) params.set("active", active === "active" ? "true" : "false");
        if (businessId) params.set("businessId", businessId);
        if (minDuration) params.set("minDuration", minDuration);
        if (maxDuration) params.set("maxDuration", maxDuration);
        if (minPrice) params.set("minPrice", minPrice);
        if (maxPrice) params.set("maxPrice", maxPrice);
        const data = await apiRequest<PaginatedResponse<ServiceItem>>(
          `/admin/platform/services?${params.toString()}`,
          api.authHeaders
        );
        setPlatformServices(data.items);
        setPlatformServicesTotal(data.total);
        setPlatformServicesLoaded(true);
      } catch (err) {
        api.setError(err instanceof Error ? err.message : "Error cargando servicios globales");
      } finally {
        api.setLoading(false);
        endLoad();
      }
    },
    [api, endLoad, startLoad]
  );

  const loadPlatformResources = useCallback(
    async (page = 1, limit = 25, search = "", active: ActiveFilter = "", businessId = "") => {
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        resourcesQueryRef.current = { page, limit, search, active, businessId };
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (search) params.set("search", search);
        if (active) params.set("active", active === "active" ? "true" : "false");
        if (businessId) params.set("businessId", businessId);
        const data = await apiRequest<PaginatedResponse<ResourceItem>>(
          `/admin/platform/resources?${params.toString()}`,
          api.authHeaders
        );
        setPlatformResources(data.items);
        setPlatformResourcesTotal(data.total);
        setPlatformResourcesLoaded(true);
      } catch (err) {
        api.setError(err instanceof Error ? err.message : "Error cargando recursos globales");
      } finally {
        api.setLoading(false);
        endLoad();
      }
    },
    [api, endLoad, startLoad]
  );

  const loadPlatformBlocks = useCallback(
    async (
      options: {
        page?: number;
        limit?: number;
        businessId?: string;
        resourceId?: string;
        search?: string;
        type?: BlockTypeFilter;
        from?: string;
        to?: string;
      } = {}
    ) => {
      const {
        page = 1,
        limit = 25,
        businessId = "",
        resourceId = "",
        search = "",
        type = "",
        from = "",
        to = ""
      } = options;
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        blocksQueryRef.current = { page, limit, businessId, resourceId, search, type, from, to };
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (businessId) params.set("businessId", businessId);
        if (resourceId) params.set("resourceId", resourceId);
        if (search) params.set("search", search);
        if (type) params.set("type", type);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        const data = await apiRequest<PaginatedResponse<BlockItem>>(
          `/admin/platform/blocks?${params.toString()}`,
          api.authHeaders
        );
        setPlatformBlocks(data.items);
        setPlatformBlocksTotal(data.total);
        setPlatformBlocksLoaded(true);
      } catch (err) {
        api.setError(err instanceof Error ? err.message : "Error cargando bloqueos globales");
      } finally {
        api.setLoading(false);
        endLoad();
      }
    },
    [api, endLoad, startLoad]
  );

  async function createBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
    api.resetSuccess();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: readFormString(form, "name"),
      slug: readFormString(form, "slug"),
      timezone: readFormString(form, "timezone") || undefined,
      contactPhone: readFormString(form, "contactPhone") || undefined,
      address: readFormString(form, "address") || undefined,
      status: (readFormString(form, "status") as StatusFilter) || undefined
    };

    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest("/admin/platform/businesses", {
        method: "POST",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      event.currentTarget.reset();
      await loadBusinesses(
        businessesQueryRef.current.page,
        businessesQueryRef.current.limit,
        businessesQueryRef.current.search,
        businessesQueryRef.current.status as StatusFilter
      );
      api.setSuccess("Negocio creado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando negocio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function createOwner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
    api.resetSuccess();
    const form = new FormData(event.currentTarget);
    const payload = {
      businessId: readFormString(form, "businessId"),
      email: readFormString(form, "email"),
      password: readFormString(form, "password")
    };

    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest("/admin/platform/owners", {
        method: "POST",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      event.currentTarget.reset();
      setOwnerBusinessId("");
      api.setSuccess("Owner creado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando owner");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function updateBusiness(businessId: string, payload: Partial<BusinessProfile>) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/platform/businesses/${businessId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      await loadBusinesses(
        businessesQueryRef.current.page,
        businessesQueryRef.current.limit,
        businessesQueryRef.current.search,
        businessesQueryRef.current.status as StatusFilter
      );
      api.setSuccess("Negocio actualizado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando negocio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function deleteBusiness(businessId: string) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/platform/businesses/${businessId}`, {
        method: "DELETE",
        ...api.authHeaders
      });
      await loadBusinesses(
        businessesQueryRef.current.page,
        businessesQueryRef.current.limit,
        businessesQueryRef.current.search,
        businessesQueryRef.current.status as StatusFilter
      );
      api.setSuccess("Negocio eliminado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando negocio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  function resetLoaded() {
    setBusinessesLoaded(false);
    setPlatformOwnersLoaded(false);
    setPlatformStaffLoaded(false);
    setPlatformAppointmentsLoaded(false);
    setPlatformServicesLoaded(false);
    setPlatformResourcesLoaded(false);
    setPlatformBlocksLoaded(false);
  }

  async function updatePlatformUser(userId: string, payload: PlatformUserUpdate) {
    api.resetError();
    api.resetSuccess();
    try {
      api.setLoading(true);
      await apiRequest(`/admin/platform/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      await Promise.all([
        loadPlatformOwners(
          ownersQueryRef.current.page,
          ownersQueryRef.current.limit,
          ownersQueryRef.current.search,
          ownersQueryRef.current.active as ActiveFilter
        ),
        loadPlatformStaff(
          staffQueryRef.current.page,
          staffQueryRef.current.limit,
          staffQueryRef.current.search,
          staffQueryRef.current.active as ActiveFilter
        )
      ]);
      api.setSuccess("Usuario actualizado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando usuario");
    } finally {
      api.setLoading(false);
    }
  }

  async function deletePlatformUser(userId: string) {
    api.resetError();
    api.resetSuccess();
    try {
      api.setLoading(true);
      await apiRequest(`/admin/platform/users/${userId}`, {
        method: "DELETE",
        ...api.authHeaders
      });
      await Promise.all([
        loadPlatformOwners(
          ownersQueryRef.current.page,
          ownersQueryRef.current.limit,
          ownersQueryRef.current.search,
          ownersQueryRef.current.active as ActiveFilter
        ),
        loadPlatformStaff(
          staffQueryRef.current.page,
          staffQueryRef.current.limit,
          staffQueryRef.current.search,
          staffQueryRef.current.active as ActiveFilter
        )
      ]);
      api.setSuccess("Usuario eliminado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando usuario");
    } finally {
      api.setLoading(false);
    }
  }

  async function createPlatformService(
    businessId: string,
    payload: { name: string; durationMinutes: number; price?: number }
  ) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/services`, {
        method: "POST",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      await loadPlatformServices({
        page: servicesQueryRef.current.page,
        limit: servicesQueryRef.current.limit,
        search: servicesQueryRef.current.search,
        active: servicesQueryRef.current.active as ActiveFilter,
        businessId: servicesQueryRef.current.businessId,
        minDuration: servicesQueryRef.current.minDuration,
        maxDuration: servicesQueryRef.current.maxDuration,
        minPrice: servicesQueryRef.current.minPrice,
        maxPrice: servicesQueryRef.current.maxPrice
      });
      api.setSuccess("Servicio creado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando servicio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function updatePlatformService(
    businessId: string,
    serviceId: string,
    payload: Partial<ServiceItem>
  ) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/services/${serviceId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      await loadPlatformServices({
        page: servicesQueryRef.current.page,
        limit: servicesQueryRef.current.limit,
        search: servicesQueryRef.current.search,
        active: servicesQueryRef.current.active as ActiveFilter,
        businessId: servicesQueryRef.current.businessId,
        minDuration: servicesQueryRef.current.minDuration,
        maxDuration: servicesQueryRef.current.maxDuration,
        minPrice: servicesQueryRef.current.minPrice,
        maxPrice: servicesQueryRef.current.maxPrice
      });
      api.setSuccess("Servicio actualizado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando servicio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function deletePlatformService(businessId: string, serviceId: string) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/services/${serviceId}`, {
        method: "DELETE",
        ...api.authHeaders
      });
      await loadPlatformServices({
        page: servicesQueryRef.current.page,
        limit: servicesQueryRef.current.limit,
        search: servicesQueryRef.current.search,
        active: servicesQueryRef.current.active as ActiveFilter,
        businessId: servicesQueryRef.current.businessId,
        minDuration: servicesQueryRef.current.minDuration,
        maxDuration: servicesQueryRef.current.maxDuration,
        minPrice: servicesQueryRef.current.minPrice,
        maxPrice: servicesQueryRef.current.maxPrice
      });
      api.setSuccess("Servicio eliminado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando servicio");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function createPlatformResource(businessId: string, payload: { name: string }) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/resources`, {
        method: "POST",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      await loadPlatformResources(
        resourcesQueryRef.current.page,
        resourcesQueryRef.current.limit,
        resourcesQueryRef.current.search,
        resourcesQueryRef.current.active as ActiveFilter,
        resourcesQueryRef.current.businessId
      );
      api.setSuccess("Recurso creado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando recurso");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function updatePlatformResource(
    businessId: string,
    resourceId: string,
    payload: Partial<ResourceItem>
  ) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/resources/${resourceId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      await loadPlatformResources(
        resourcesQueryRef.current.page,
        resourcesQueryRef.current.limit,
        resourcesQueryRef.current.search,
        resourcesQueryRef.current.active as ActiveFilter,
        resourcesQueryRef.current.businessId
      );
      api.setSuccess("Recurso actualizado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando recurso");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function deletePlatformResource(businessId: string, resourceId: string) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/resources/${resourceId}`, {
        method: "DELETE",
        ...api.authHeaders
      });
      await loadPlatformResources(
        resourcesQueryRef.current.page,
        resourcesQueryRef.current.limit,
        resourcesQueryRef.current.search,
        resourcesQueryRef.current.active as ActiveFilter,
        resourcesQueryRef.current.businessId
      );
      api.setSuccess("Recurso eliminado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando recurso");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function createPlatformBlock(businessId: string, payload: Partial<BlockItem>) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      const payloadToSend = {
        ...payload,
        startTime: payload.startTime ? toIsoIfPossible(payload.startTime) : undefined,
        endTime: payload.endTime ? toIsoIfPossible(payload.endTime) : undefined
      };
      await apiRequest(`/admin/businesses/${businessId}/blocks`, {
        method: "POST",
        body: JSON.stringify(payloadToSend),
        ...api.authHeaders
      });
      await loadPlatformBlocks({
        page: blocksQueryRef.current.page,
        limit: blocksQueryRef.current.limit,
        businessId: blocksQueryRef.current.businessId,
        resourceId: blocksQueryRef.current.resourceId,
        search: blocksQueryRef.current.search,
        type: blocksQueryRef.current.type as BlockTypeFilter,
        from: blocksQueryRef.current.from,
        to: blocksQueryRef.current.to
      });
      api.setSuccess("Bloqueo creado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando bloqueo");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function updatePlatformBlock(
    businessId: string,
    blockId: string,
    payload: Partial<BlockItem>
  ) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      const payloadToSend = {
        ...payload,
        startTime: payload.startTime ? toIsoIfPossible(payload.startTime) : undefined,
        endTime: payload.endTime ? toIsoIfPossible(payload.endTime) : undefined
      };
      await apiRequest(`/admin/businesses/${businessId}/blocks/${blockId}`, {
        method: "PATCH",
        body: JSON.stringify(payloadToSend),
        ...api.authHeaders
      });
      await loadPlatformBlocks({
        page: blocksQueryRef.current.page,
        limit: blocksQueryRef.current.limit,
        businessId: blocksQueryRef.current.businessId,
        resourceId: blocksQueryRef.current.resourceId,
        search: blocksQueryRef.current.search,
        type: blocksQueryRef.current.type as BlockTypeFilter,
        from: blocksQueryRef.current.from,
        to: blocksQueryRef.current.to
      });
      api.setSuccess("Bloqueo actualizado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando bloqueo");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function deletePlatformBlock(businessId: string, blockId: string) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/blocks/${blockId}`, {
        method: "DELETE",
        ...api.authHeaders
      });
      await loadPlatformBlocks({
        page: blocksQueryRef.current.page,
        limit: blocksQueryRef.current.limit,
        businessId: blocksQueryRef.current.businessId,
        resourceId: blocksQueryRef.current.resourceId,
        search: blocksQueryRef.current.search,
        type: blocksQueryRef.current.type as BlockTypeFilter,
        from: blocksQueryRef.current.from,
        to: blocksQueryRef.current.to
      });
      api.setSuccess("Bloqueo eliminado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando bloqueo");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function savePlatformHours(businessId: string, payloadHours: BusinessHoursItem[]) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/hours`, {
        method: "PATCH",
        body: JSON.stringify({ hours: payloadHours }),
        ...api.authHeaders
      });
      await loadBusinesses(
        businessesQueryRef.current.page,
        businessesQueryRef.current.limit,
        businessesQueryRef.current.search,
        businessesQueryRef.current.status as StatusFilter
      );
      api.setSuccess("Horarios actualizados.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error guardando horarios");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function savePlatformPolicies(businessId: string, payload: Policies) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${businessId}/policies`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      await loadBusinesses(
        businessesQueryRef.current.page,
        businessesQueryRef.current.limit,
        businessesQueryRef.current.search,
        businessesQueryRef.current.status as StatusFilter
      );
      api.setSuccess("Politicas actualizadas.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error guardando politicas");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  return {
    businesses,
    businessesTotal,
    businessesLoaded,
    ownerBusinessId,
    setOwnerBusinessId,
    platformOwners,
    platformStaff,
    platformOwnersTotal,
    platformStaffTotal,
    platformAppointments,
    platformAppointmentsTotal,
    platformAppointmentsDate,
    setPlatformAppointmentsDate,
    platformAppointmentsStatus,
    setPlatformAppointmentsStatus,
    platformAppointmentsSearch,
    setPlatformAppointmentsSearch,
    platformOwnersLoaded,
    platformStaffLoaded,
    platformAppointmentsLoaded,
    platformServices,
    platformResources,
    platformBlocks,
    platformServicesTotal,
    platformResourcesTotal,
    platformBlocksTotal,
    platformServicesLoaded,
    platformResourcesLoaded,
    platformBlocksLoaded,
    loadBusinesses,
    loadPlatformOwners,
    loadPlatformStaff,
    loadPlatformAppointments,
    loadPlatformServices,
    loadPlatformResources,
    loadPlatformBlocks,
    createBusiness,
    createOwner,
    updateBusiness,
    deleteBusiness,
    updatePlatformUser,
    deletePlatformUser,
    createPlatformService,
    updatePlatformService,
    deletePlatformService,
    createPlatformResource,
    updatePlatformResource,
    deletePlatformResource,
    createPlatformBlock,
    updatePlatformBlock,
    deletePlatformBlock,
    savePlatformHours,
    savePlatformPolicies,
    resetLoaded
  };
}
