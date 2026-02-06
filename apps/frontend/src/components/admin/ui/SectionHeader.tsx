import React from "react";

export function SectionHeader({
  title,
  subtitle,
  actions
}: Readonly<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}>) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
