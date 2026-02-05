import React from "react";
import { TabKey, tabConfig } from "../types";

export function AdminSidebar({
  activeTab,
  availableTabs,
  canUseBusinessTabs,
  onSelectTab
}: Readonly<{
  activeTab: TabKey;
  availableTabs: TabKey[];
  canUseBusinessTabs: boolean;
  onSelectTab: (tab: TabKey) => void;
}>) {
  const isPlatformTab = (key: TabKey) => key.startsWith("platform_");

  return (
    <aside className="w-full rounded-2xl border border-slate-200 bg-white p-5 md:w-72">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Modulos</p>
      </div>
      <nav className="flex flex-col gap-1">
        {tabConfig
          .filter((tab) => availableTabs.includes(tab.key))
          .filter((tab) => (isPlatformTab(tab.key) ? true : canUseBusinessTabs))
          .map((tab) => (
            <button
              key={tab.key}
              className={`rounded-xl px-3 py-2.5 text-left text-sm font-medium ${
                activeTab === tab.key
                  ? "bg-primary-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => onSelectTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
      </nav>
    </aside>
  );
}
