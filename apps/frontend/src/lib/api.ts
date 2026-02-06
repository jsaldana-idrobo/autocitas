export const API_BASE = import.meta.env.PUBLIC_API_BASE || "http://localhost:3000/api";

export interface AuthResponse {
  token: string;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const mergedHeaders: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (token) {
    mergedHeaders.Authorization = `Bearer ${token}`;
  }
  if (headers) {
    Object.assign(mergedHeaders, headers);
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: mergedHeaders
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}
