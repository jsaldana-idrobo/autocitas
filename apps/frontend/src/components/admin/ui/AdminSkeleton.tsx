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
  const headerKeys = Array.from({ length: cols }, (_, idx) => `th-${idx}`);
  const rowKeys = Array.from({ length: rows }, (_, idx) => `row-${idx}`);
  const colKeys = Array.from({ length: cols }, (_, idx) => `cell-${idx}`);

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
          {headerKeys.map((key) => (
            <SkeletonBlock key={key} className="h-3 w-full" />
          ))}
        </div>
        {rowKeys.map((rowKey) => (
          <div key={rowKey} className="grid grid-cols-4 gap-3 border-b border-slate-100 px-4 py-3">
            {colKeys.map((colKey) => (
              <SkeletonBlock key={`${rowKey}-${colKey}`} className="h-3 w-full" />
            ))}
          </div>
        ))}
      </div>
    </SkeletonCard>
  );
}

function FormSkeleton() {
  const fieldKeys = Array.from({ length: 6 }, (_, idx) => `field-${idx}`);

  return (
    <SkeletonCard>
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-48" />
        <SkeletonBlock className="h-3 w-64" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {fieldKeys.map((key) => (
          <SkeletonBlock key={key} className="h-10 w-full rounded-xl" />
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
  const metricKeys = Array.from({ length: 3 }, (_, idx) => `metric-${idx}`);
  const dayKeys = Array.from({ length: 7 }, (_, idx) => `day-${idx}`);
  const timeKeys = Array.from({ length: 8 }, (_, idx) => `time-${idx}`);
  const colKeys = Array.from({ length: 7 }, (_, idx) => `col-${idx}`);

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
        {metricKeys.map((key) => (
          <SkeletonBlock key={key} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-2">
        <div />
        {dayKeys.map((key) => (
          <SkeletonBlock key={key} className="h-4 w-full" />
        ))}
        <div className="space-y-2">
          {timeKeys.map((key) => (
            <SkeletonBlock key={key} className="h-6 w-full" />
          ))}
        </div>
        {colKeys.map((key) => (
          <SkeletonBlock key={key} className="h-56 w-full rounded-xl" />
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
