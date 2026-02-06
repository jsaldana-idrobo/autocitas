import { useCallback, useRef, useState } from "react";
import { apiRequest } from "../../../../../lib/api";
import { BlockItem, PaginatedResponse } from "../../../types";
import { AdminApiContext } from "../../types";
import { createPaginationParams } from "../../shared/utils";
import { buildBlockPayload } from "../utils";
import type { PlatformLoadGuard } from "../utils";

type BlockTypeFilter = "" | "resource" | "global";

type PlatformBlocksState = {
  platformBlocks: BlockItem[];
  platformBlocksTotal: number;
  platformBlocksLoaded: boolean;
};

type PlatformBlocksActions = {
  loadPlatformBlocks: (options?: {
    page?: number;
    limit?: number;
    businessId?: string;
    resourceId?: string;
    search?: string;
    type?: BlockTypeFilter;
    from?: string;
    to?: string;
  }) => Promise<void>;
  createPlatformBlock: (businessId: string, payload: Partial<BlockItem>) => Promise<void>;
  updatePlatformBlock: (
    businessId: string,
    blockId: string,
    payload: Partial<BlockItem>
  ) => Promise<void>;
  deletePlatformBlock: (businessId: string, blockId: string) => Promise<void>;
  resetPlatformBlocksLoaded: () => void;
};

export function usePlatformBlocks(
  api: AdminApiContext,
  loadGuard: PlatformLoadGuard
): PlatformBlocksState & PlatformBlocksActions {
  const { startLoad, endLoad } = loadGuard;
  const [platformBlocks, setPlatformBlocks] = useState<BlockItem[]>([]);
  const [platformBlocksTotal, setPlatformBlocksTotal] = useState(0);
  const [platformBlocksLoaded, setPlatformBlocksLoaded] = useState(false);
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

  const buildBlocksQueryOptions = () => ({
    page: blocksQueryRef.current.page,
    limit: blocksQueryRef.current.limit,
    businessId: blocksQueryRef.current.businessId,
    resourceId: blocksQueryRef.current.resourceId,
    search: blocksQueryRef.current.search,
    type: blocksQueryRef.current.type as BlockTypeFilter,
    from: blocksQueryRef.current.from,
    to: blocksQueryRef.current.to
  });

  const refreshPlatformBlocks = async () => loadPlatformBlocks(buildBlocksQueryOptions());

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
        const params = createPaginationParams(page, limit);
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

  async function createPlatformBlock(businessId: string, payload: Partial<BlockItem>) {
    api.resetError();
    api.resetSuccess();
    try {
      if (!startLoad()) return;
      api.setLoading(true);
      const payloadToSend = buildBlockPayload(payload);
      await apiRequest(`/admin/businesses/${businessId}/blocks`, {
        method: "POST",
        body: JSON.stringify(payloadToSend),
        ...api.authHeaders
      });
      await refreshPlatformBlocks();
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
      const payloadToSend = buildBlockPayload(payload);
      await apiRequest(`/admin/businesses/${businessId}/blocks/${blockId}`, {
        method: "PATCH",
        body: JSON.stringify(payloadToSend),
        ...api.authHeaders
      });
      await refreshPlatformBlocks();
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
      await refreshPlatformBlocks();
      api.setSuccess("Bloqueo eliminado.");
    } catch (err) {
      api.setError(err instanceof Error ? err.message : "Error eliminando bloqueo");
    } finally {
      api.setLoading(false);
      endLoad();
    }
  }

  const resetPlatformBlocksLoaded = () => setPlatformBlocksLoaded(false);

  return {
    platformBlocks,
    platformBlocksTotal,
    platformBlocksLoaded,
    loadPlatformBlocks,
    createPlatformBlock,
    updatePlatformBlock,
    deletePlatformBlock,
    resetPlatformBlocksLoaded
  };
}
