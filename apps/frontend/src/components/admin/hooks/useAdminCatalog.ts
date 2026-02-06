import { useCallback, useRef } from "react";
import { AdminApiContext } from "./types";
import { useAdminCatalogResources } from "./catalog/useAdminCatalogResources";
import { useAdminCatalogServices } from "./catalog/useAdminCatalogServices";
import { useAdminCatalogStaff } from "./catalog/useAdminCatalogStaff";

export function useAdminCatalog(api: AdminApiContext) {
  const isLoadingRef = useRef(false);

  const startLoad = useCallback(() => {
    if (isLoadingRef.current) return false;
    isLoadingRef.current = true;
    return true;
  }, []);

  const endLoad = useCallback(() => {
    isLoadingRef.current = false;
  }, []);

  const loadGuard = { startLoad, endLoad };

  const { resetServicesLoaded, ...services } = useAdminCatalogServices(api, loadGuard);
  const { resetResourcesLoaded, ...resources } = useAdminCatalogResources(api, loadGuard);
  const { resetStaffLoaded, ...staff } = useAdminCatalogStaff(api, loadGuard);

  const resetLoaded = useCallback(() => {
    resetServicesLoaded();
    resetResourcesLoaded();
    resetStaffLoaded();
  }, [resetResourcesLoaded, resetServicesLoaded, resetStaffLoaded]);

  return {
    ...services,
    ...resources,
    ...staff,
    resetLoaded
  };
}
