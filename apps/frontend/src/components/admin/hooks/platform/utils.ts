import { toIsoIfPossible } from "../utils";
import { BlockItem } from "../types";

export type PlatformLoadGuard = {
  startLoad: () => boolean;
  endLoad: () => void;
};

export function readFormString(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function createPaginationParams(page: number, limit: number) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  return params;
}

export function buildBlockPayload(payload: Partial<BlockItem>) {
  return {
    ...payload,
    startTime: payload.startTime ? toIsoIfPossible(payload.startTime) : undefined,
    endTime: payload.endTime ? toIsoIfPossible(payload.endTime) : undefined
  };
}
