import { useCallback, useRef, useState, type FormEvent } from "react";
import { apiRequest } from "../../../lib/api";
import { BlockItem, PaginatedResponse } from "../types";
import { toIsoIfPossible } from "../utils";
import { AdminApiContext } from "./types";

export function useAdminBlocks(api: AdminApiContext) {
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [blocksTotal, setBlocksTotal] = useState(0);
  const [blocksLoaded, setBlocksLoaded] = useState(false);
  const isLoadingRef = useRef(false);
  const blocksQueryRef = useRef({ page: 1, limit: 25, search: "" });

  const startLoad = useCallback(() => {
    if (isLoadingRef.current) return false;
    isLoadingRef.current = true;
    return true;
  }, []);

  const endLoad = useCallback(() => {
    isLoadingRef.current = false;
  }, []);

  const loadBlocks = useCallback(
    async (page = 1, limit = 25, search = "") => {
      if (!startLoad()) return;
      api.setLoading(true);
      api.resetError();
      api.resetSuccess();
      try {
        blocksQueryRef.current = { page, limit, search };
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (search) params.set("search", search);
        const data = await apiRequest<PaginatedResponse<BlockItem>>(
          `/admin/businesses/${api.businessId}/blocks?${params.toString()}`,
          api.authHeaders
        );
        setBlocks(data.items);
        setBlocksTotal(data.total);
        setBlocksLoaded(true);
      } catch (err) {
        api.setError(err instanceof Error ? err.message : "Error cargando bloqueos");
      } finally {
        api.setLoading(false);
        endLoad();
      }
    },
    [api, endLoad, startLoad]
  );

  async function createBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    api.resetError();
    api.resetSuccess();
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
      await loadBlocks(
        blocksQueryRef.current.page,
        blocksQueryRef.current.limit,
        blocksQueryRef.current.search
      );
      api.setSuccess("Bloqueo creado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando bloqueo");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function updateBlock(blockId: string, payload: Partial<BlockItem>) {
    api.resetError();
    api.resetSuccess();
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
      await loadBlocks(
        blocksQueryRef.current.page,
        blocksQueryRef.current.limit,
        blocksQueryRef.current.search
      );
      api.setSuccess("Bloqueo actualizado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando bloqueo");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  async function deleteBlock(blockId: string) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/blocks/${blockId}`, {
        method: "DELETE",
        ...api.authHeaders
      });
      await loadBlocks(
        blocksQueryRef.current.page,
        blocksQueryRef.current.limit,
        blocksQueryRef.current.search
      );
      api.setSuccess("Bloqueo eliminado.");
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
    blocksTotal,
    blocksLoaded,
    loadBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
    resetLoaded
  };
}
