import { AdminApiContext } from "../types";
import { usePlatformBlocks } from "./catalog/usePlatformBlocks";
import { usePlatformResources } from "./catalog/usePlatformResources";
import { usePlatformServices } from "./catalog/usePlatformServices";
import { type PlatformLoadGuard } from "./utils";

export function useAdminPlatformCatalog(api: AdminApiContext, loadGuard: PlatformLoadGuard) {
  const { resetPlatformServicesLoaded, ...services } = usePlatformServices(api, loadGuard);
  const { resetPlatformResourcesLoaded, ...resources } = usePlatformResources(api, loadGuard);
  const { resetPlatformBlocksLoaded, ...blocks } = usePlatformBlocks(api, loadGuard);

  const resetCatalogLoaded = () => {
    resetPlatformServicesLoaded();
    resetPlatformResourcesLoaded();
    resetPlatformBlocksLoaded();
  };

  return {
    ...services,
    ...resources,
    ...blocks,
    resetCatalogLoaded
  };
}
