import React from "react";
import { TabKey } from "../types";

function SkeletonBlock({ className }: Readonly<{ className?: string }>) {
  return <div className={`rounded-full bg-slate-200/80 ${className ?? ""}`} />;
}

function SkeletonCard({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div className="animate-pulse space-y-4">{children}</div>
    </div>
  );
}

function TableSkeleton({ rows = 6, cols = 4 }: Readonly<{ rows?: number; cols?: number }>) {
  return (
    <SkeletonCard>
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="h-3 w-72" />
      </div>
      <div className="flex flex-wrap gap-2">
        <SkeletonBlock className="h-9 w-40 rounded-xl" />
        <SkeletonBlock className="h-9 w-32 rounded-xl" />
        <SkeletonBlock className="h-9 w-28 rounded-xl" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-4 gap-3 border-b border-slate-100 px-4 py-3 text-xs text-slate-300">
          {Array.from({ length: cols }).map((_, index) => (
            <SkeletonBlock key={`th-${index}`} className="h-3 w-full" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, row) => (
          <div
            key={`row-${row}`}
            className="grid grid-cols-4 gap-3 border-b border-slate-100 px-4 py-3"
          >
            {Array.from({ length: cols }).map((_, col) => (
              <SkeletonBlock key={`cell-${row}-${col}`} className="h-3 w-full" />
            ))}
          </div>
        ))}
      </div>
    </SkeletonCard>
  );
}

function FormSkeleton() {
  return (
    <SkeletonCard>
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-48" />
        <SkeletonBlock className="h-3 w-64" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock key={`field-${index}`} className="h-10 w-full rounded-xl" />
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <SkeletonBlock className="h-9 w-24 rounded-xl" />
        <SkeletonBlock className="h-9 w-28 rounded-xl" />
      </div>
    </SkeletonCard>
  );
}

function CalendarSkeleton() {
  return (
    <SkeletonCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="h-3 w-56" />
        </div>
        <div className="flex flex-wrap gap-2">
          <SkeletonBlock className="h-8 w-28 rounded-xl" />
          <SkeletonBlock className="h-8 w-28 rounded-xl" />
          <SkeletonBlock className="h-8 w-24 rounded-xl" />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBlock key={`metric-${index}`} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-2">
        <div />
        {Array.from({ length: 7 }).map((_, index) => (
          <SkeletonBlock key={`day-${index}`} className="h-4 w-full" />
        ))}
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonBlock key={`time-${index}`} className="h-6 w-full" />
          ))}
        </div>
        {Array.from({ length: 7 }).map((_, index) => (
          <SkeletonBlock key={`col-${index}`} className="h-56 w-full rounded-xl" />
        ))}
      </div>
    </SkeletonCard>
  );
}

export function AdminSkeleton({
  activeTab
}: Readonly<{
  activeTab: TabKey;
  role: string;
}>) {
  if (activeTab === "calendar") {
    return <CalendarSkeleton />;
  }

  if (activeTab === "business" || activeTab === "hours" || activeTab === "policies") {
    return <FormSkeleton />;
  }

  const wideTableTabs: TabKey[] = [
    "appointments",
    "blocks",
    "services",
    "resources",
    "staff",
    "platform_appointments",
    "platform_blocks",
    "platform_services",
    "platform_resources",
    "platform_businesses",
    "platform_owners",
    "platform_staff"
  ];

  if (wideTableTabs.includes(activeTab)) {
    return <TableSkeleton rows={6} cols={5} />;
  }

  return <TableSkeleton rows={5} cols={4} />;
}
