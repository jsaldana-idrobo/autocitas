import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type MutableRefObject,
  type SetStateAction
} from "react";
import { apiRequest } from "../../../../lib/api";
import { PaginatedResponse, PlatformUserUpdate, StaffItem } from "../../types";
import { AdminApiContext } from "../types";
import { createPaginationParams, readFormString } from "../shared/utils";
import type { PlatformLoadGuard } from "./utils";

type ActiveFilter = "" | "active" | "inactive";
type UsersQueryRef = MutableRefObject<{
  page: number;
  limit: number;
  search: string;
  active: string;
}>;
type PlatformUsersRole = "owner" | "staff";
type PlatformUsersQuery = {
  page?: number;
  limit?: number;
  search?: string;
  active?: ActiveFilter;
};
type LoadPlatformUsersConfig = {
  role: PlatformUsersRole;
  queryRef: UsersQueryRef;
  setItems: Dispatch<SetStateAction<StaffItem[]>>;
  setTotal: Dispatch<SetStateAction<number>>;
  setLoaded: Dispatch<SetStateAction<boolean>>;
  errorMessage: string;
};

type UsersState = {
  ownerBusinessId: string;
  platformOwners: StaffItem[];
  platformStaff: StaffItem[];
  platformOwnersTotal: number;
  platformStaffTotal: number;
  platformOwnersLoaded: boolean;
  platformStaffLoaded: boolean;
};

type UsersActions = {
  setOwnerBusinessId: (value: string) => void;
  loadPlatformOwners: (
    page?: number,
    limit?: number,
    search?: string,
    active?: ActiveFilter
  ) => Promise<void>;
  loadPlatformStaff: (
    page?: number,
    limit?: number,
    search?: string,
    active?: ActiveFilter
  ) => Promise<void>;
  createOwner: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  updatePlatformUser: (userId: string, payload: PlatformUserUpdate) => Promise<void>;
  deletePlatformUser: (userId: string) => Promise<void>;
  resetUsersLoaded: () => void;
};

export function useAdminPlatformUsers(
  api: AdminApiContext,
  loadGuard: PlatformLoadGuard
): UsersState & UsersActions {
  const { startLoad, endLoad } = loadGuard;
  const [ownerBusinessId, setOwnerBusinessId] = useState("");
  const [platformOwners, setPlatformOwners] = useState<StaffItem[]>([]);
  const [platformStaff, setPlatformStaff] = useState<StaffItem[]>([]);
  const [platformOwnersTotal, setPlatformOwnersTotal] = useState(0);
  const [platformStaffTotal, setPlatformStaffTotal] = useState(0);
  const [platformOwnersLoaded, setPlatformOwnersLoaded] = useState(false);
  const [platformStaffLoaded, setPlatformStaffLoaded] = useState(false);
  const ownersQueryRef = useRef({ page: 1, limit: 25, search: "", active: "" });
  const staffQueryRef = useRef({ page: 1, limit: 25, search: "", active: "" });

  const loadPlatformUsers = useCallback(
    async (config: LoadPlatformUsersConfig, query: PlatformUsersQuery = {}) => {
      const { role, queryRef, setItems, setTotal, setLoaded, errorMessage } = config;
      const { page = 1, limit = 25, search = "", active = "" } = query;
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        queryRef.current = { page, limit, search, active };
        const params = createPaginationParams(page, limit);
        params.set("role", role);
        if (search) params.set("search", search);
        if (active) params.set("active", active === "active" ? "true" : "false");
        const data = await apiRequest<PaginatedResponse<StaffItem>>(
          `/admin/platform/users?${params.toString()}`,
          api.authHeaders
        );
        setItems(data.items);
        setTotal(data.total);
        setLoaded(true);
      } catch (err) {
        api.setError(err instanceof Error ? err.message : errorMessage);
      } finally {
        api.setLoading(false);
        endLoad();
      }
    },
    [api, endLoad, startLoad]
  );

  const loadPlatformOwners = useCallback(
    async (page = 1, limit = 25, search = "", active: ActiveFilter = "") =>
      loadPlatformUsers(
        {
          role: "owner",
          queryRef: ownersQueryRef,
          setItems: setPlatformOwners,
          setTotal: setPlatformOwnersTotal,
          setLoaded: setPlatformOwnersLoaded,
          errorMessage: "Error cargando owners"
        },
        { page, limit, search, active }
      ),
    [loadPlatformUsers]
  );

  const loadPlatformStaff = useCallback(
    async (page = 1, limit = 25, search = "", active: ActiveFilter = "") =>
      loadPlatformUsers(
        {
          role: "staff",
          queryRef: staffQueryRef,
          setItems: setPlatformStaff,
          setTotal: setPlatformStaffTotal,
          setLoaded: setPlatformStaffLoaded,
          errorMessage: "Error cargando staff"
        },
        { page, limit, search, active }
      ),
    [loadPlatformUsers]
  );

  const reloadUsers = useCallback(async () => {
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
  }, [loadPlatformOwners, loadPlatformStaff]);

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
      await reloadUsers();
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
      await reloadUsers();
      api.setSuccess("Usuario eliminado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando usuario");
    } finally {
      api.setLoading(false);
    }
  }

  const resetUsersLoaded = () => {
    setPlatformOwnersLoaded(false);
    setPlatformStaffLoaded(false);
  };

  return {
    ownerBusinessId,
    setOwnerBusinessId,
    platformOwners,
    platformStaff,
    platformOwnersTotal,
    platformStaffTotal,
    platformOwnersLoaded,
    platformStaffLoaded,
    loadPlatformOwners,
    loadPlatformStaff,
    createOwner,
    updatePlatformUser,
    deletePlatformUser,
    resetUsersLoaded
  };
}
