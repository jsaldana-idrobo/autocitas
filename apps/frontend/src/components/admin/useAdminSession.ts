import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

export type Role = "owner" | "staff" | "platform_admin" | "unknown";

function parseJwt(token: string): { role: Role; resourceId?: string; businessId?: string } {
  try {
    const payload = token.split(".")[1];
    if (!payload) return { role: "unknown" };
    const json = JSON.parse(atob(payload));
    return {
      role: json.role ?? "unknown",
      resourceId: json.resourceId,
      businessId: json.businessId
    };
  } catch {
    return { role: "unknown" };
  }
}

export function useAdminSession() {
  const [token, setToken] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [role, setRole] = useState<Role>("unknown");
  const [resourceId, setResourceId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const storage = globalThis.localStorage;
    const storedToken = storage?.getItem("admin_token") || "";
    const storedBusiness = storage?.getItem("business_id") || "";
    setToken(storedToken);
    setBusinessId(storedBusiness);
    const payload = parseJwt(storedToken);
    setRole(payload.role);
    setResourceId(payload.resourceId);
    if (!storedBusiness && payload.businessId) {
      storage?.setItem("business_id", payload.businessId);
      setBusinessId(payload.businessId);
    }
  }, []);

  async function login(email: string, password: string) {
    const response = await apiRequest<{ token: string }>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    const storage = globalThis.localStorage;
    storage?.setItem("admin_token", response.token);
    setToken(response.token);
    const payload = parseJwt(response.token);
    setRole(payload.role);
    setResourceId(payload.resourceId);
    if (payload.role !== "platform_admin" && payload.role !== "unknown") {
      const inferred = payload.businessId ?? "";
      if (inferred) {
        storage?.setItem("business_id", inferred);
        setBusinessId(inferred);
      }
    }
    return payload;
  }

  function logout() {
    const storage = globalThis.localStorage;
    storage?.removeItem("admin_token");
    storage?.removeItem("business_id");
    setToken("");
    setBusinessId("");
    setRole("unknown");
    setResourceId(undefined);
  }

  function selectBusiness(id: string) {
    const storage = globalThis.localStorage;
    storage?.setItem("business_id", id);
    setBusinessId(id);
  }

  return {
    token,
    businessId,
    role,
    resourceId,
    login,
    logout,
    selectBusiness
  };
}
