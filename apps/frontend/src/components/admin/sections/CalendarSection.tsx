import React, { useMemo, useState } from "react";
import { addDays, getTodayValue } from "../utils";
import { AppointmentItem, BlockItem, ResourceItem, ServiceItem } from "../types";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { CalendarSummary } from "./calendar/CalendarSummary";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { CalendarModal } from "./calendar/modals/CalendarModal";
import { CalendarEditModal } from "./calendar/modals/CalendarEditModal";
import { BlockModal } from "./calendar/modals/BlockModal";
import { isSameDay } from "./calendar/utils";

export function CalendarSection({
  weekStart,
  intervalMinutes,
  onPrevWeek,
  onNextWeek,
  onIntervalChange,
  onSelectResource,
  selectedResourceId,
  resources,
  services,
  appointments,
  blocks,
  onCreateAppointment,
  onCreateBlock,
  onUpdateAppointment,
  onCancelAppointment,
  userRole,
  resourceId
}: Readonly<{
  weekStart: string;
  intervalMinutes: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onIntervalChange: (value: number) => void;
  onSelectResource: (value: string) => void;
  selectedResourceId: string;
  resources: ResourceItem[];
  services: ServiceItem[];
  appointments: AppointmentItem[];
  blocks: BlockItem[];
  onCreateAppointment: (payload: {
    serviceId: string;
    resourceId?: string;
    customerName: string;
    customerPhone: string;
    startTime: string;
  }) => void;
  onCreateBlock: (payload: {
    startTime: string;
    endTime: string;
    resourceId?: string;
    reason?: string;
  }) => void;
  onUpdateAppointment: (
    appointmentId: string,
    payload: { serviceId?: string; resourceId?: string; startTime?: string }
  ) => void;
  onCancelAppointment: (appointmentId: string) => void;
  userRole: "owner" | "staff" | "platform_admin" | "unknown";
  resourceId?: string;
}>) {
  const [showCreate, setShowCreate] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentItem | null>(null);
  const canSelectResource = userRole !== "staff";

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart]
  );
  const todayValue = getTodayValue();
  const initialMobileDay = days.includes(todayValue) ? todayValue : (days[0] ?? todayValue);
  const [mobileDay, setMobileDay] = useState(initialMobileDay);

  const filteredAppointments = useMemo(() => {
    if (userRole === "staff") {
      return appointments;
    }
    if (selectedResourceId) {
      return appointments.filter((appt) => appt.resourceId === selectedResourceId);
    }
    return appointments;
  }, [appointments, selectedResourceId, userRole]);

  const filteredBlocks = useMemo(() => {
    if (userRole === "staff") {
      return blocks;
    }
    if (selectedResourceId) {
      return blocks.filter((block) => block.resourceId === selectedResourceId || !block.resourceId);
    }
    return blocks;
  }, [blocks, selectedResourceId, userRole]);

  const summary = useMemo(() => {
    const weekAppointments = filteredAppointments.filter((appt) => appt.status !== "cancelled");
    const todayAppointments = weekAppointments.filter((appt) =>
      isSameDay(appt.startTime, todayValue)
    );
    const blockedCount = filteredBlocks.length;
    return {
      weekAppointments: weekAppointments.length,
      todayAppointments: todayAppointments.length,
      blockedCount
    };
  }, [filteredAppointments, filteredBlocks, todayValue]);

  return (
    <section className="card overflow-x-hidden p-4 md:p-6">
      <CalendarHeader
        weekStart={weekStart}
        intervalMinutes={intervalMinutes}
        onPrevWeek={onPrevWeek}
        onNextWeek={onNextWeek}
        onIntervalChange={onIntervalChange}
        canSelectResource={canSelectResource}
        selectedResourceId={selectedResourceId}
        onSelectResource={onSelectResource}
        resources={resources}
        onCreateAppointment={() => setShowCreate(true)}
        onCreateBlock={() => setShowBlock(true)}
      />

      <CalendarSummary
        todayAppointments={summary.todayAppointments}
        weekAppointments={summary.weekAppointments}
        blockedCount={summary.blockedCount}
      />

      <div className="mt-4 md:hidden">
        <div className="flex flex-wrap gap-2">
          {days.map((day) => {
            const date = new Date(`${day}T00:00:00`);
            const label = date.toLocaleDateString("es-CO", { weekday: "short" });
            const dayNumber = date.getDate();
            const isActive = day === mobileDay;
            return (
              <button
                key={day}
                className={`rounded-2xl border px-3 py-2 text-xs font-semibold ${
                  isActive
                    ? "border-primary-200 bg-primary-50 text-primary-700"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
                onClick={() => setMobileDay(day)}
              >
                <div className="uppercase tracking-wide">{label}</div>
                <div className="text-base font-bold">{dayNumber}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid gap-3">
          {filteredAppointments
            .filter((appt) => isSameDay(appt.startTime, mobileDay))
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .map((appt) => {
              const service = services.find((item) => item._id === appt.serviceId);
              const resourceLabel = appt.resourceId
                ? resources.find((item) => item._id === appt.resourceId)?.name
                : undefined;
              return (
                <button
                  key={appt._id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left"
                  onClick={() => setEditingAppointment(appt)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-slate-500">
                        {new Date(appt.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}{" "}
                        ·{" "}
                        {new Date(appt.endTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                      <div className="text-base font-semibold text-slate-900">
                        {appt.customerName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {service?.name ?? appt.serviceName ?? "Servicio"}
                        {resourceLabel ? ` · ${resourceLabel}` : ""}
                      </div>
                    </div>
                    <span className="rounded-full border border-slate-200 px-2 py-1 text-[10px] uppercase text-slate-500">
                      {appt.status}
                    </span>
                  </div>
                </button>
              );
            })}
          {filteredBlocks
            .filter((block) => isSameDay(block.startTime, mobileDay))
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .map((block) => (
              <div
                key={block._id}
                className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4"
              >
                <div className="text-sm text-slate-500">
                  {new Date(block.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}{" "}
                  ·{" "}
                  {new Date(block.endTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </div>
                <div className="text-base font-semibold text-slate-900">
                  {block.reason || "Bloqueo"}
                </div>
              </div>
            ))}
          {filteredAppointments.filter((appt) => isSameDay(appt.startTime, mobileDay)).length ===
            0 &&
            filteredBlocks.filter((block) => isSameDay(block.startTime, mobileDay)).length ===
              0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                No hay eventos para este dia.
              </div>
            )}
        </div>
      </div>

      <div className="hidden md:block">
        <CalendarGrid
          days={days}
          intervalMinutes={intervalMinutes}
          appointments={filteredAppointments}
          blocks={filteredBlocks}
          services={services}
          resources={resources}
          onSelectAppointment={setEditingAppointment}
        />
      </div>

      {showCreate && (
        <CalendarModal
          title="Nueva cita"
          services={services}
          resources={resources}
          canSelectResource={canSelectResource}
          fixedResourceId={userRole === "staff" ? resourceId : undefined}
          onClose={() => setShowCreate(false)}
          onSubmit={(payload) => {
            onCreateAppointment(payload);
            setShowCreate(false);
          }}
        />
      )}

      {showBlock && (
        <BlockModal
          resources={resources}
          canSelectResource={canSelectResource}
          fixedResourceId={userRole === "staff" ? resourceId : undefined}
          onClose={() => setShowBlock(false)}
          onSubmit={(payload) => {
            onCreateBlock(payload);
            setShowBlock(false);
          }}
        />
      )}

      {editingAppointment && (
        <CalendarEditModal
          appointment={editingAppointment}
          services={services}
          resources={resources}
          canSelectResource={canSelectResource}
          fixedResourceId={userRole === "staff" ? resourceId : undefined}
          onClose={() => setEditingAppointment(null)}
          onCancel={() => {
            onCancelAppointment(editingAppointment._id);
            setEditingAppointment(null);
          }}
          onSubmit={(payload) => {
            onUpdateAppointment(editingAppointment._id, payload);
            setEditingAppointment(null);
          }}
        />
      )}
    </section>
  );
}
