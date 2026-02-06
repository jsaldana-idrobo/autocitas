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
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (role === "staff") return "appointments";
    if (role === "platform_admin") return "platform_businesses";
    return "services";
  });

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

  const loadPlatformBusinessesIfNeeded = useCallback(async () => {
    if (!platform.businessesLoaded) {
      await platform.loadBusinesses(1, 25, "", "");
    }
  }, [platform]);

  const loadPlatformResourcesIfNeeded = useCallback(async () => {
    if (!platform.platformResourcesLoaded) {
      await platform.loadPlatformResources(1, 25, "", "", "");
    }
  }, [platform]);

  const loadPlatformServicesIfNeeded = useCallback(async () => {
    if (!platform.platformServicesLoaded) {
      await platform.loadPlatformServices({ page: 1, limit: 25 });
    }
  }, [platform]);

  const loadPlatformBlocksIfNeeded = useCallback(async () => {
    if (!platform.platformBlocksLoaded) {
      await platform.loadPlatformBlocks({ page: 1, limit: 25 });
    }
  }, [platform]);

  const platformTabHandlers = useMemo(() => {
    const ensureBusinesses = async () => {
      await loadPlatformBusinessesIfNeeded();
    };
    const ensureResources = async () => {
      await loadPlatformResourcesIfNeeded();
    };
    const ensureServices = async () => {
      await loadPlatformServicesIfNeeded();
    };
    const ensureBlocks = async () => {
      await loadPlatformBlocksIfNeeded();
    };

    return {
      platform_businesses: async () => {
        if (!platform.businessesLoaded) {
          await onPlatformBusinesses();
        }
      },
      platform_owners: async () => {
        await onPlatformOwners();
      },
      platform_staff: async () => {
        await onPlatformStaff();
      },
      platform_appointments: async () => {
        await onPlatformAppointments();
      },
      platform_services: async () => {
        await ensureBusinesses();
        await ensureResources();
        await ensureServices();
      },
      platform_resources: async () => {
        await ensureBusinesses();
        await ensureResources();
      },
      platform_blocks: async () => {
        await ensureBusinesses();
        await ensureResources();
        await ensureBlocks();
      },
      platform_hours: async () => {
        await ensureBusinesses();
      },
      platform_policies: async () => {
        await ensureBusinesses();
      },
      platform_calendar: async () => {
        await ensureBusinesses();
        await ensureResources();
        await ensureServices();
      }
    } satisfies Partial<Record<TabKey, AsyncVoid>>;
  }, [
    loadPlatformBlocksIfNeeded,
    loadPlatformBusinessesIfNeeded,
    loadPlatformResourcesIfNeeded,
    loadPlatformServicesIfNeeded,
    onPlatformAppointments,
    onPlatformBusinesses,
    onPlatformOwners,
    onPlatformStaff,
    platform.businessesLoaded
  ]);

  const handlePlatformTab = useCallback(
    (tab: TabKey) => {
      const handler = platformTabHandlers[tab];
      if (!handler) {
        return false;
      }
      fireAndForget(Promise.resolve(handler()));
      return true;
    },
    [fireAndForget, platformTabHandlers]
  );

  const businessTabHandlers = useMemo(() => {
    return {
      services: async () => {
        if (!catalog.servicesLoaded) {
          await catalog.loadServices(1, 25, "", "");
        }
      },
      resources: async () => {
        if (!catalog.resourcesLoaded) {
          await catalog.loadResources(1, 25, "", "");
        }
      },
      staff: async () => {
        if (!catalog.staffLoaded) {
          await Promise.all([catalog.loadStaff(1, 25, "", ""), catalog.ensureResourcesLoaded()]);
        }
      },
      blocks: async () => {
        if (!blocks.blocksLoaded) {
          await onBlocksTab();
        }
      },
      calendar: async () => {
        if (!calendar.calendarLoaded) {
          await Promise.all([catalog.ensureResourcesLoaded(), catalog.ensureServicesLoaded()]);
          await calendar.loadCalendarData();
        }
      },
      business: async () => {
        if (!businessSettings.businessLoaded) {
          await businessSettings.loadBusinessSettings();
        }
      },
      hours: async () => {
        if (!businessSettings.businessLoaded) {
          await businessSettings.loadBusinessSettings();
        }
      },
      policies: async () => {
        if (!businessSettings.businessLoaded) {
          await businessSettings.loadBusinessSettings();
        }
      },
      appointments: async () => {
        if (!appointments.appointmentsLoaded) {
          await onAppointmentsTab();
        }
      }
    } satisfies Partial<Record<TabKey, AsyncVoid>>;
  }, [
    appointments.appointmentsLoaded,
    blocks.blocksLoaded,
    businessSettings,
    calendar,
    catalog,
    onAppointmentsTab,
    onBlocksTab
  ]);

  const handleBusinessTab = useCallback(
    (tab: TabKey) => {
      const handler = businessTabHandlers[tab];
      if (!handler) {
        return false;
      }
      fireAndForget(Promise.resolve(handler()));
      return true;
    },
    [businessTabHandlers, fireAndForget]
  );

  const handleTabSelect = useCallback(
    (tab: TabKey) => {
      setActiveTab(tab);
      if (handlePlatformTab(tab)) {
        return;
      }
      handleBusinessTab(tab);
    },
    [handleBusinessTab, handlePlatformTab]
  );

  return {
    activeTab,
    setActiveTab,
    availableTabs,
    canUseBusinessTabs,
    handleTabSelect
  };
}
