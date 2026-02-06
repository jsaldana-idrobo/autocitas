import { useCallback, useEffect, useMemo, useState } from "react";
import { getTodayValue } from "./utils";
import { ownerTabs, platformTabs, staffTabs, TabKey } from "./types";
import { useAdminAppointments } from "./hooks/useAdminAppointments";
import { useAdminBlocks } from "./hooks/useAdminBlocks";
import { useAdminBusinessSettings } from "./hooks/useAdminBusinessSettings";
import { useAdminCalendar } from "./hooks/useAdminCalendar";
import { useAdminCatalog } from "./hooks/useAdminCatalog";
import { useAdminPlatform } from "./hooks/useAdminPlatform";

export type AsyncVoid = () => Promise<void>;

export type TabControllerDeps = {
  role: string;
  businessId: string;
  platform: ReturnType<typeof useAdminPlatform>;
  catalog: ReturnType<typeof useAdminCatalog>;
  businessSettings: ReturnType<typeof useAdminBusinessSettings>;
  blocks: ReturnType<typeof useAdminBlocks>;
  appointments: ReturnType<typeof useAdminAppointments>;
  calendar: ReturnType<typeof useAdminCalendar>;
  fireAndForget: (promise: Promise<unknown>) => void;
};

export function useAdminTabController({
  role,
  businessId,
  platform,
  catalog,
  businessSettings,
  blocks,
  appointments,
  calendar,
  fireAndForget
}: TabControllerDeps) {
  const [activeTab, setActiveTab] = useState<TabKey>("services");

  useEffect(() => {
    if (role === "staff") {
      setActiveTab("appointments");
    }
    if (role === "platform_admin") {
      setActiveTab("platform_businesses");
    }
  }, [role]);

  useEffect(() => {
    if (!businessId) return;
    catalog.resetLoaded();
    blocks.resetLoaded();
    appointments.resetLoaded();
    businessSettings.resetLoaded();
    calendar.resetLoaded();
  }, [businessId, catalog, blocks, appointments, businessSettings, calendar]);

  useEffect(() => {
    if (role === "platform_admin" && activeTab === "platform_businesses") {
      if (!platform.businessesLoaded) {
        fireAndForget(platform.loadBusinesses(1, 25, "", ""));
      }
    }
  }, [activeTab, fireAndForget, platform, role]);

  const availableTabs = useMemo(() => {
    if (role === "staff") return staffTabs;
    if (role === "platform_admin") return platformTabs;
    return ownerTabs;
  }, [role]);

  const canUseBusinessTabs = role !== "platform_admin" || businessId.length > 0;

  const onPlatformBusinesses = useCallback(async () => {
    await platform.loadBusinesses(1, 25, "", "");
  }, [platform]);

  const onPlatformOwners = useCallback(async () => {
    if (!platform.platformOwnersLoaded) {
      await platform.loadPlatformOwners(1, 25, "", "");
    }
  }, [platform]);

  const onPlatformStaff = useCallback(async () => {
    if (!platform.platformStaffLoaded) {
      await platform.loadPlatformStaff(1, 25, "", "");
    }
  }, [platform]);

  const onPlatformAppointments = useCallback(async () => {
    const nextDate = platform.platformAppointmentsDate || getTodayValue();
    if (!platform.platformAppointmentsDate) {
      platform.setPlatformAppointmentsDate(nextDate);
    }
    if (!platform.platformAppointmentsLoaded) {
      await platform.loadPlatformAppointments(
        nextDate,
        platform.platformAppointmentsStatus,
        platform.platformAppointmentsSearch,
        1,
        25
      );
    }
  }, [platform]);

  const onBlocksTab = useCallback(async () => {
    if (role === "staff") {
      await blocks.loadBlocks(1, 25, "");
      return;
    }
    await Promise.all([blocks.loadBlocks(1, 25, ""), catalog.ensureResourcesLoaded()]);
  }, [blocks, catalog, role]);

  const onAppointmentsTab = useCallback(async () => {
    const nextDate = appointments.appointmentsDate || getTodayValue();
    if (!appointments.appointmentsDate) {
      appointments.setAppointmentsDate(nextDate);
    }
    if (role === "staff") {
      await appointments.loadAppointments(
        nextDate,
        appointments.appointmentsStatus,
        appointments.appointmentsSearch,
        1,
        25
      );
      return;
    }
    await Promise.all([
      appointments.loadAppointments(
        nextDate,
        appointments.appointmentsStatus,
        appointments.appointmentsSearch,
        1,
        25
      ),
      catalog.ensureResourcesLoaded(),
      catalog.ensureServicesLoaded()
    ]);
  }, [appointments, catalog, role]);

  const handleTabSelect = useCallback(
    (tab: TabKey) => {
      setActiveTab(tab);
      if (tab === "platform_businesses") {
        if (!platform.businessesLoaded) {
          fireAndForget(onPlatformBusinesses());
        }
        return;
      }
      if (tab === "platform_owners") {
        fireAndForget(onPlatformOwners());
        return;
      }
      if (tab === "platform_staff") {
        fireAndForget(onPlatformStaff());
        return;
      }
      if (tab === "platform_appointments") {
        fireAndForget(onPlatformAppointments());
        return;
      }
      if (tab === "platform_services") {
        fireAndForget(
          (async () => {
            if (!platform.businessesLoaded) {
              await platform.loadBusinesses(1, 25, "", "");
            }
            if (!platform.platformResourcesLoaded) {
              await platform.loadPlatformResources(1, 25, "", "", "");
            }
            if (!platform.platformServicesLoaded) {
              await platform.loadPlatformServices({ page: 1, limit: 25 });
            }
          })()
        );
        return;
      }
      if (tab === "platform_resources") {
        fireAndForget(
          (async () => {
            if (!platform.businessesLoaded) {
              await platform.loadBusinesses(1, 25, "", "");
            }
            if (!platform.platformResourcesLoaded) {
              await platform.loadPlatformResources(1, 25, "", "", "");
            }
          })()
        );
        return;
      }
      if (tab === "platform_blocks") {
        fireAndForget(
          (async () => {
            if (!platform.businessesLoaded) {
              await platform.loadBusinesses(1, 25, "", "");
            }
            if (!platform.platformResourcesLoaded) {
              await platform.loadPlatformResources(1, 25, "", "", "");
            }
            if (!platform.platformBlocksLoaded) {
              await platform.loadPlatformBlocks({ page: 1, limit: 25 });
            }
          })()
        );
        return;
      }
      if (tab === "platform_hours" || tab === "platform_policies" || tab === "platform_calendar") {
        fireAndForget(
          (async () => {
            if (!platform.businessesLoaded) {
              await platform.loadBusinesses(1, 25, "", "");
            }
            if (tab === "platform_calendar") {
              if (!platform.platformResourcesLoaded) {
                await platform.loadPlatformResources(1, 25, "", "", "");
              }
              if (!platform.platformServicesLoaded) {
                await platform.loadPlatformServices({ page: 1, limit: 25 });
              }
            }
          })()
        );
        return;
      }
      if (tab === "services") {
        if (!catalog.servicesLoaded) {
          fireAndForget(catalog.loadServices(1, 25, "", ""));
        }
        return;
      }
      if (tab === "resources") {
        if (!catalog.resourcesLoaded) {
          fireAndForget(catalog.loadResources(1, 25, "", ""));
        }
        return;
      }
      if (tab === "staff") {
        if (!catalog.staffLoaded) {
          fireAndForget(
            Promise.all([catalog.loadStaff(1, 25, "", ""), catalog.ensureResourcesLoaded()])
          );
        }
        return;
      }
      if (tab === "blocks") {
        if (!blocks.blocksLoaded) {
          fireAndForget(onBlocksTab());
        }
        return;
      }
      if (tab === "calendar") {
        if (!calendar.calendarLoaded) {
          fireAndForget(
            Promise.all([catalog.ensureResourcesLoaded(), catalog.ensureServicesLoaded()])
          );
          fireAndForget(calendar.loadCalendarData());
        }
        return;
      }
      if (tab === "business" || tab === "hours" || tab === "policies") {
        if (!businessSettings.businessLoaded) {
          fireAndForget(businessSettings.loadBusinessSettings());
        }
        return;
      }
      if (tab === "appointments") {
        if (!appointments.appointmentsLoaded) {
          fireAndForget(onAppointmentsTab());
        }
      }
    },
    [
      appointments,
      blocks,
      businessSettings,
      calendar,
      catalog,
      fireAndForget,
      onAppointmentsTab,
      onBlocksTab,
      onPlatformAppointments,
      onPlatformBusinesses,
      onPlatformOwners,
      onPlatformStaff,
      platform
    ]
  );

  return {
    activeTab,
    setActiveTab,
    availableTabs,
    canUseBusinessTabs,
    handleTabSelect
  };
}
