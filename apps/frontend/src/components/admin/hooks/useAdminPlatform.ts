import { useCallback, useRef } from "react";
import { AdminApiContext } from "./types";
import { useAdminPlatformAppointments } from "./platform/useAdminPlatformAppointments";
import { useAdminPlatformBusinesses } from "./platform/useAdminPlatformBusinesses";
import { useAdminPlatformCatalog } from "./platform/useAdminPlatformCatalog";
import { useAdminPlatformUsers } from "./platform/useAdminPlatformUsers";

export function useAdminPlatform(api: AdminApiContext) {
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

  const { resetBusinessesLoaded, ...businesses } = useAdminPlatformBusinesses(api, loadGuard);
  const { resetUsersLoaded, ...users } = useAdminPlatformUsers(api, loadGuard);
  const { resetAppointmentsLoaded, ...appointments } = useAdminPlatformAppointments(api, loadGuard);
  const { resetCatalogLoaded, ...catalog } = useAdminPlatformCatalog(api, loadGuard);

  const resetLoaded = () => {
    resetBusinessesLoaded();
    resetUsersLoaded();
    resetAppointmentsLoaded();
    resetCatalogLoaded();
  };

  return {
    ...businesses,
    ...users,
    ...appointments,
    ...catalog,
    resetLoaded
  };
}
