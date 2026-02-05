import { useRef, useState, type FormEvent } from "react";
import { apiRequest } from "../../../lib/api";
import { BlockItem } from "../types";
import { toIsoIfPossible } from "../utils";
import { AdminApiContext } from "./types";

export function useAdminBlocks(api: AdminApiContext) {
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [blocksLoaded, setBlocksLoaded] = useState(false);
  const isLoadingRef = useRef(false);

  function startLoad() {
    if (isLoadingRef.current) return false;
    isLoadingRef.current = true;
    return true;
  }

  function endLoad() {
    isLoadingRef.current = false;
  }

  async function loadBlocks() {
    if (!startLoad()) return;
    api.setLoading(true);
    api.resetError();
    try {
      const data = await apiRequest<BlockItem[]>(
        `/admin/businesses/${api.businessId}/blocks`,
        api.authHeaders
      );
      setBlocks(data);
      setBlocksLoaded(true);
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error cargando bloqueos");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function createBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
    const form = new FormData(event.currentTarget);
    const startRaw = String(form.get("startTime") || "").trim();
    const endRaw = String(form.get("endTime") || "").trim();
    const payload = {
      startTime: toIsoIfPossible(startRaw),
      endTime: toIsoIfPossible(endRaw),
      resourceId: String(form.get("resourceId") || "").trim() || undefined,
      reason: String(form.get("reason") || "").trim() || undefined
    };
    if (api.role === "staff" && api.resourceId) {
      payload.resourceId = api.resourceId;
    }

    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/blocks`, {
        method: "POST",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      event.currentTarget.reset();
      setBlocksLoaded(false);
      await loadBlocks();
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando bloqueo");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function updateBlock(blockId: string, payload: Partial<BlockItem>) {
    api.resetError();
    const payloadToSend = {
      ...payload,
      startTime: payload.startTime ? toIsoIfPossible(payload.startTime) : undefined,
      endTime: payload.endTime ? toIsoIfPossible(payload.endTime) : undefined
    };
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/blocks/${blockId}`, {
        method: "PATCH",
        body: JSON.stringify(payloadToSend),
        ...api.authHeaders
      });
      setBlocksLoaded(false);
      await loadBlocks();
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando bloqueo");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function deleteBlock(blockId: string) {
    api.resetError();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/blocks/${blockId}`, {
        method: "DELETE",
        ...api.authHeaders
      });
      setBlocksLoaded(false);
      await loadBlocks();
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando bloqueo");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  function resetLoaded() {
    setBlocksLoaded(false);
  }

  return {
    blocks,
    blocksLoaded,
    loadBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
    resetLoaded
  };
}
