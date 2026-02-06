import { BadRequestException, NotFoundException } from "@nestjs/common";
import { DateTime } from "luxon";
import { Appointment } from "../schemas/appointment.schema.js";
import { Block } from "../schemas/block.schema.js";
import { Business } from "../schemas/business.schema.js";
import { Resource } from "../schemas/resource.schema.js";
import { Types } from "mongoose";

export const DEFAULT_TIMEZONE = "America/Bogota";
export const STATUS_ACTIVE = "active";
export const STATUS_BOOKED = "booked";
export const ERR_INVALID_APPOINTMENT_ID = "Invalid appointmentId.";
export const ERR_BUSINESS_NOT_FOUND = "Business not found";
export const ERR_INVALID_SERVICE_ID = "Invalid serviceId.";
export const ERR_INVALID_RESOURCE_ID = "Invalid resourceId.";
export const ERR_SERVICE_NOT_FOUND = "Service not found";
export const ERR_START_TIME_PAST = "Start time must be in the future.";
export const ERR_APPOINTMENT_NOT_FOUND = "Appointment not found";
export const ERR_CANCEL_WINDOW = "Cancellation window has passed.";
export const ERR_RESCHEDULE_LIMIT = "Reschedule limit reached.";

export function assertActiveBusiness(business: Business | null): asserts business is Business {
  if (business?.status !== STATUS_ACTIVE) {
    throw new NotFoundException(ERR_BUSINESS_NOT_FOUND);
  }
}

export interface SlotAvailability {
  startTime: string;
  endTime: string;
  resourceIds: string[];
}

interface TimeInterval {
  start: number;
  end: number;
}

type ResourceWithId = Resource & { _id: Types.ObjectId };

export function parseDate(date: string, timezone: string) {
  const dateLocal = DateTime.fromISO(date, { zone: timezone });
  if (!dateLocal.isValid) {
    throw new BadRequestException("Invalid date format. Use YYYY-MM-DD.");
  }
  return dateLocal;
}

export function parseBusinessHours(dateLocal: DateTime, openTime: string, closeTime: string) {
  const openParts = openTime.split(":").map(Number);
  const closeParts = closeTime.split(":").map(Number);
  if (openParts.length !== 2 || closeParts.length !== 2) {
    throw new BadRequestException("Invalid business hours configuration.");
  }

  const openLocal = dateLocal.set({
    hour: openParts[0],
    minute: openParts[1],
    second: 0,
    millisecond: 0
  });
  const closeLocal = dateLocal.set({
    hour: closeParts[0],
    minute: closeParts[1],
    second: 0,
    millisecond: 0
  });

  return { openLocal, closeLocal };
}

export function buildAppointmentMap(appointments: Appointment[]) {
  const appointmentMap = new Map<string, TimeInterval[]>();
  for (const appt of appointments) {
    if (!appt.resourceId) continue;
    const key = appt.resourceId.toString();
    const list = appointmentMap.get(key) ?? [];
    list.push({ start: appt.startTime.getTime(), end: appt.endTime.getTime() });
    appointmentMap.set(key, list);
  }
  return appointmentMap;
}

export function buildBlockMap(blocks: Block[]) {
  const blockMap = new Map<string, TimeInterval[]>();
  for (const block of blocks) {
    const key = block.resourceId ? block.resourceId.toString() : "*";
    const list = blockMap.get(key) ?? [];
    list.push({ start: block.startTime.getTime(), end: block.endTime.getTime() });
    blockMap.set(key, list);
  }
  return blockMap;
}

export function generateSlots(params: {
  openLocal: DateTime;
  closeLocal: DateTime;
  durationMinutes: number;
  resources: ResourceWithId[];
  appointmentMap: Map<string, TimeInterval[]>;
  blockMap: Map<string, TimeInterval[]>;
}) {
  const slotMap = new Map<string, SlotAvailability>();

  for (const resource of params.resources) {
    const resourceId = resource._id.toString();
    const resourceAppointments = params.appointmentMap.get(resourceId) ?? [];
    const resourceBlocks = params.blockMap.get(resourceId) ?? [];
    const globalBlocks = params.blockMap.get("*") ?? [];
    const intervals = [...resourceAppointments, ...resourceBlocks, ...globalBlocks];

    let cursor = params.openLocal;
    while (cursor.plus({ minutes: params.durationMinutes }) <= params.closeLocal) {
      const slotStartLocal = cursor;
      const slotEndLocal = cursor.plus({ minutes: params.durationMinutes });
      const slotStartUtc = slotStartLocal.toUTC().toJSDate();
      const slotEndUtc = slotEndLocal.toUTC().toJSDate();
      const slotStartMs = slotStartUtc.getTime();
      const slotEndMs = slotEndUtc.getTime();

      const hasConflict = intervals.some(
        (interval) => interval.start < slotEndMs && interval.end > slotStartMs
      );

      if (!hasConflict) {
        const key = slotStartUtc.toISOString();
        const existing = slotMap.get(key);
        if (existing) {
          existing.resourceIds.push(resourceId);
        } else {
          slotMap.set(key, {
            startTime: slotStartUtc.toISOString(),
            endTime: slotEndUtc.toISOString(),
            resourceIds: [resourceId]
          });
        }
      }

      cursor = cursor.plus({ minutes: params.durationMinutes });
    }
  }

  return Array.from(slotMap.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function filterSlotsForToday(
  slots: SlotAvailability[],
  dateLocal: DateTime,
  timezone: string
) {
  const now = DateTime.now().setZone(timezone);
  if (!dateLocal.hasSame(now, "day")) {
    return slots;
  }
  const nowUtcMillis = now.toUTC().toMillis();
  return slots.filter((slot) => DateTime.fromISO(slot.startTime).toMillis() > nowUtcMillis);
}
