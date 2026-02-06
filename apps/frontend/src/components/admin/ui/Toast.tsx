import React from "react";

export type ToastVariant = "success" | "error";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

function ToastCard({
  message,
  onClose,
  variant
}: Readonly<{
  message: string;
  onClose: () => void;
  variant: ToastVariant;
}>) {
  const tone =
    variant === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div
      className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg ${tone} animate-toast`}
    >
      <div className="flex items-center gap-3">
        <span>{message}</span>
        <button className="text-xs underline" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

export function ToastStack({
  toasts,
  onClose
}: Readonly<{
  toasts: ToastItem[];
  onClose: (id: string) => void;
}>) {
  React.useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) => setTimeout(() => onClose(toast.id), 3000));
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [toasts, onClose]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-6 top-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </div>
  );
}
