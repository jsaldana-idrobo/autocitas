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
    const storedToken = window.localStorage.getItem("admin_token") || "";
    const storedBusiness = window.localStorage.getItem("business_id") || "";
    setToken(storedToken);
    setBusinessId(storedBusiness);
    const payload = parseJwt(storedToken);
    setRole(payload.role);
    setResourceId(payload.resourceId);
    if (!storedBusiness && payload.businessId) {
      localStorage.setItem("business_id", payload.businessId);
      setBusinessId(payload.businessId);
    }
  }, []);

  async function login(email: string, password: string) {
    const response = await apiRequest<{ token: string }>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem("admin_token", response.token);
    setToken(response.token);
    const payload = parseJwt(response.token);
    setRole(payload.role);
    setResourceId(payload.resourceId);
    if (payload.role !== "platform_admin" && payload.role !== "unknown") {
      const inferred = payload.businessId ?? "";
      if (inferred) {
        localStorage.setItem("business_id", inferred);
        setBusinessId(inferred);
      }
    }
    return payload;
  }

  function logout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("business_id");
    setToken("");
    setBusinessId("");
    setRole("unknown");
    setResourceId(undefined);
  }

  function selectBusiness(id: string) {
    localStorage.setItem("business_id", id);
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
