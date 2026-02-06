import React from "react";

export function Badge({
  children,
  tone = "neutral"
}: Readonly<{
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}>) {
  const toneClasses: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
    neutral: "bg-slate-100 text-slate-600"
  };
  const toneClass = toneClasses[tone] ?? toneClasses.neutral;

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${toneClass}`}>{children}</span>
  );
}
