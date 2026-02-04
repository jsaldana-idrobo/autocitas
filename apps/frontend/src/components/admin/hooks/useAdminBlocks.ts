import { useState, type FormEvent } from "react";
import { apiRequest } from "../../../lib/api";
import { BlockItem } from "../types";
import { toIsoIfPossible } from "../utils";
import { AdminApiContext } from "./types";

export function useAdminBlocks(api: AdminApiContext) {
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  async function loadBlocks() {
    api.setLoading(true);
    api.resetError();
    try {
      const data = await apiRequest<BlockItem[]>(`/admin/businesses/${api.businessId}/blocks`, api.authHeaders);
      setBlocks(data);
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error cargando bloqueos");
    } finally {
      api.setLoading(false);
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
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/blocks`, {
        method: "POST",
        body: JSON.stringify(payload),
        ...api.authHeaders
      });
      event.currentTarget.reset();
      await loadBlocks();
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error creando bloqueo");
    } finally {
      api.setLoading(false);
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
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/blocks/${blockId}`, {
        method: "PATCH",
        body: JSON.stringify(payloadToSend),
        ...api.authHeaders
      });
      setEditingBlockId(null);
      await loadBlocks();
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error actualizando bloqueo");
    } finally {
      api.setLoading(false);
    }
  }

  async function deleteBlock(blockId: string) {
    if (!confirm("Deseas eliminar este bloqueo?")) {
      return;
    }
    api.resetError();
    try {
      api.setLoading(true);
      await apiRequest(`/admin/businesses/${api.businessId}/blocks/${blockId}`, {
        method: "DELETE",
        ...api.authHeaders
      });
      await loadBlocks();
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando bloqueo");
    } finally {
      api.setLoading(false);
    }
  }

  return {
    blocks,
    editingBlockId,
    setEditingBlockId,
    loadBlocks,
    createBlock,
    updateBlock,
    deleteBlock
  };
}
