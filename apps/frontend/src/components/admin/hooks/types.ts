import { Role } from "../useAdminSession";

export interface AdminApiContext {
  authHeaders: { token: string };
  businessId: string;
  role: Role;
  resourceId?: string;
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
  setSuccess: (value: string | null) => void;
  resetError: () => void;
  resetSuccess: () => void;
}
