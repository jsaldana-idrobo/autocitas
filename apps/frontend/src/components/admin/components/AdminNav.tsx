import React from "react";
import { TabKey, tabConfig } from "../types";

export function AdminNav({
  activeTab,
  availableTabs,
  canUseBusinessTabs,
  onSelectTab
}: {
  activeTab: TabKey;
  availableTabs: TabKey[];
  canUseBusinessTabs: boolean;
  onSelectTab: (tab: TabKey) => void;
}) {
  return (
    <nav className="flex flex-wrap gap-2">
      {tabConfig
        .filter((tab) => availableTabs.includes(tab.key))
        .filter((tab) => (tab.key === "platform" ? true : canUseBusinessTabs))
        .map((tab) => (
          <button
            key={tab.key}
            className={`rounded-full px-4 py-2 text-sm ${
              activeTab === tab.key
                ? "bg-primary-600 text-white"
                : "bg-white/70 text-slate-700 shadow-sm"
            }`}
            onClick={() => onSelectTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
    </nav>
  );
}
