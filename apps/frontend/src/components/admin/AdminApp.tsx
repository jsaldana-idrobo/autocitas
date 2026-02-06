import React, { useMemo, useState } from "react";
import { AdminContent } from "./AdminContent";
import { AdminHeader } from "./components/AdminHeader";
import { AdminLogin } from "./components/AdminLogin";
import { AdminSidebar } from "./components/AdminSidebar";
import { useAdminAppointments } from "./hooks/useAdminAppointments";
import { useAdminBlocks } from "./hooks/useAdminBlocks";
import { useAdminBusinessSettings } from "./hooks/useAdminBusinessSettings";
import { useAdminCalendar } from "./hooks/useAdminCalendar";
import { useAdminCatalog } from "./hooks/useAdminCatalog";
import { useAdminPlatform } from "./hooks/useAdminPlatform";
import { useAdminSession } from "./useAdminSession";
import { useCalendarNavigation } from "./useCalendarNavigation";
import { useAdminTabController } from "./useAdminTabController";
import { ToastStack } from "./ui/Toast";
import { useToastStack } from "./ui/useToastStack";

export function AdminApp() {
  const { token, businessId, role, resourceId, login, logout } = useAdminSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toasts, pushToast, handleToastClose } = useToastStack();

  const authHeaders = useMemo(() => ({ token }), [token]);
  const resetError = React.useCallback(() => setError(null), []);
  const resetSuccess = React.useCallback(() => {}, []);
  const setSuccess = React.useCallback(
    (value: string | null) => {
      if (value) pushToast(value, "success");
    },
    [pushToast]
  );
  const setErrorWithToast = React.useCallback(
    (value: string | null) => {
      setError(value);
      if (value) pushToast(value, "error");
    },
    [pushToast]
  );
  const fireAndForget = React.useCallback((promise: Promise<unknown>) => {
    promise.catch(() => {});
  }, []);

  const apiContext = useMemo(
    () => ({
      authHeaders,
      businessId,
      role,
      resourceId,
      setLoading,
      setError: setErrorWithToast,
      setSuccess,
      resetError,
      resetSuccess
    }),
    [
      authHeaders,
      businessId,
      role,
      resourceId,
      setLoading,
      resetError,
      resetSuccess,
      setErrorWithToast,
      setSuccess
    ]
  );

  const platform = useAdminPlatform(apiContext);
  const catalog = useAdminCatalog(apiContext);
  const businessSettings = useAdminBusinessSettings(apiContext);
  const blocks = useAdminBlocks(apiContext);
  const appointments = useAdminAppointments(apiContext);
  const calendar = useAdminCalendar(apiContext);

  const { activeTab, availableTabs, canUseBusinessTabs, handleTabSelect } = useAdminTabController({
    role,
    businessId,
    platform,
    catalog,
    businessSettings,
    blocks,
    appointments,
    calendar,
    fireAndForget
  });
  const { onPrevWeek, onNextWeek } = useCalendarNavigation(calendar, fireAndForget);

  const isAuthed = token.length > 0 && (role === "platform_admin" || businessId.length > 0);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetError();
    const form = new FormData(event.currentTarget);
    const emailValue = form.get("email");
    const passwordValue = form.get("password");
    const email = typeof emailValue === "string" ? emailValue.trim() : "";
    const password = typeof passwordValue === "string" ? passwordValue.trim() : "";

    if (!email || !password) {
      setError("Completa email y password.");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesion");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
  }

  if (!isAuthed) {
    return <AdminLogin error={error} loading={loading} onLogin={handleLogin} />;
  }

  return (
    <>
      <ToastStack toasts={toasts} onClose={handleToastClose} />
      <div className="space-y-6">
        <AdminHeader businessId={businessId} role={role} onLogout={handleLogout} />

        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          <AdminSidebar
            activeTab={activeTab}
            availableTabs={availableTabs}
            canUseBusinessTabs={canUseBusinessTabs}
            onSelectTab={handleTabSelect}
          />

          <AdminContent
            role={role}
            resourceId={resourceId}
            activeTab={activeTab}
            platform={platform}
            catalog={catalog}
            businessSettings={businessSettings}
            blocks={blocks}
            appointments={appointments}
            calendar={calendar}
            authHeaders={authHeaders}
            onError={setErrorWithToast}
            onSuccess={setSuccess}
            onLoading={setLoading}
            onPrevWeek={onPrevWeek}
            onNextWeek={onNextWeek}
            loading={loading}
          />
        </div>
      </div>
    </>
  );
}
