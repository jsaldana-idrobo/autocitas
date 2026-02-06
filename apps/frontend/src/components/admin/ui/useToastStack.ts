import { useCallback, useRef, useState } from "react";
import type { ToastItem } from "./Toast";

export function useToastStack() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);

  const createToastId = useCallback(() => {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }
    toastIdRef.current += 1;
    return `toast-${Date.now()}-${toastIdRef.current}`;
  }, []);

  const pushToast = useCallback(
    (message: string, variant: "success" | "error") => {
      setToasts((prev) => {
        const next = [...prev, { id: createToastId(), message, variant }];
        return next.slice(-3);
      });
    },
    [createToastId]
  );

  const handleToastClose = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return {
    toasts,
    pushToast,
    handleToastClose
  };
}
