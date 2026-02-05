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
    <section className="card p-6">
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

      <CalendarGrid
        days={days}
        intervalMinutes={intervalMinutes}
        appointments={filteredAppointments}
        blocks={filteredBlocks}
        services={services}
        resources={resources}
        onSelectAppointment={setEditingAppointment}
      />

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
          fixedResourceId={role === "staff" ? resourceId : undefined}
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
