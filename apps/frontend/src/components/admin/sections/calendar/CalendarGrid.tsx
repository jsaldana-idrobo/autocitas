import React, { useMemo } from "react";
import { AppointmentItem, BlockItem, ResourceItem, ServiceItem } from "../../types";
import { END_HOUR, SLOT_HEIGHT, START_HOUR, statusLabels, statusStyles } from "./constants";
import { clamp, getServiceColor, isSameDay, minutesFromStart } from "./utils";

export function CalendarGrid({
  days,
  intervalMinutes,
  appointments,
  blocks,
  services,
  resources,
  onSelectAppointment
}: {
  days: string[];
  intervalMinutes: number;
  appointments: AppointmentItem[];
  blocks: BlockItem[];
  services: ServiceItem[];
  resources: ResourceItem[];
  onSelectAppointment: (appointment: AppointmentItem) => void;
}) {
  const timeLabels = useMemo(() => {
    const labels: string[] = [];
    for (let hour = START_HOUR; hour <= END_HOUR; hour += 1) {
      labels.push(`${String(hour).padStart(2, "0")}:00`);
    }
    return labels;
  }, []);

  const serviceMap = useMemo(
    () => new Map(services.map((service) => [service._id, service])),
    [services]
  );
  const resourceMap = useMemo(
    () => new Map(resources.map((resource) => [resource._id, resource])),
    [resources]
  );

  const minutesInDay = (END_HOUR - START_HOUR) * 60;

  return (
    <div className="mt-6 grid grid-cols-[80px_repeat(7,minmax(0,1fr))] gap-2">
      <div />
      {days.map((day) => (
        <div key={day} className="text-center text-xs font-semibold text-slate-600">
          {day}
        </div>
      ))}
      <div className="space-y-2 text-xs text-slate-500">
        {timeLabels.map((label) => (
          <div key={label} style={{ height: SLOT_HEIGHT * (60 / intervalMinutes) }}>
            {label}
          </div>
        ))}
      </div>
      {days.map((day) => (
        <div key={day} className="relative border border-slate-100 bg-white">
          <div
            className="absolute inset-0"
            style={{ height: minutesInDay * (SLOT_HEIGHT / intervalMinutes) }}
          >
            {Array.from({ length: minutesInDay / intervalMinutes }).map((_, index) => (
              <div
                key={index}
                className="border-b border-dashed border-slate-100"
                style={{ height: SLOT_HEIGHT }}
              />
            ))}
          </div>
          {blocks
            .filter((block) => isSameDay(block.startTime, day))
            .map((block) => {
              const start = new Date(block.startTime);
              const end = new Date(block.endTime);
              const top =
                clamp(minutesFromStart(start), 0, minutesInDay) * (SLOT_HEIGHT / intervalMinutes);
              const height =
                clamp(minutesFromStart(end), 0, minutesInDay) * (SLOT_HEIGHT / intervalMinutes) -
                top;
              return (
                <div
                  key={block._id}
                  className="absolute left-1 right-1 rounded-md bg-slate-200/80 p-1 text-[10px] text-slate-700"
                  style={{ top, height }}
                >
                  {block.reason || "Bloqueado"}
                </div>
              );
            })}
          {appointments
            .filter((appt) => isSameDay(appt.startTime, day))
            .map((appt) => {
              const start = new Date(appt.startTime);
              const end = new Date(appt.endTime);
              const top =
                clamp(minutesFromStart(start), 0, minutesInDay) * (SLOT_HEIGHT / intervalMinutes);
              const height =
                clamp(minutesFromStart(end), 0, minutesInDay) * (SLOT_HEIGHT / intervalMinutes) -
                top;
              const service = serviceMap.get(appt.serviceId);
              const resourceLabel = appt.resourceId
                ? resourceMap.get(appt.resourceId)?.name
                : undefined;
              const statusClass = statusStyles[appt.status] || "bg-slate-100 text-slate-700";
              const statusLabel = statusLabels[appt.status] || appt.status;
              const accent = getServiceColor(appt.serviceId);
              return (
                <button
                  key={appt._id}
                  className={`absolute left-1 right-1 rounded-md p-1 text-left text-[10px] ${statusClass}`}
                  style={{ top, height }}
                  onClick={() => onSelectAppointment(appt)}
                  title={`${appt.customerName} · ${service?.name ?? "Servicio"} · ${statusLabel}${
                    resourceLabel ? ` · ${resourceLabel}` : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                    <div className="font-semibold">{appt.customerName}</div>
                  </div>
                  <div className="truncate">{service?.name ?? "Servicio"}</div>
                  <div>
                    {new Date(appt.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </button>
              );
            })}
        </div>
      ))}
    </div>
  );
}
