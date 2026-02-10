import { BadRequestException } from "@nestjs/common";
import { DateTime } from "luxon";
import type { Model } from "mongoose";
import { Block } from "../../schemas/block.schema.js";
import { Appointment } from "../../schemas/appointment.schema.js";
import { Business } from "../../schemas/business.schema.js";
import { Service } from "../../schemas/service.schema.js";
import { normalizePhoneToE164 } from "../../shared/phone.utils.js";
import {
  ERR_APPOINTMENT_CONFLICT,
  ERR_OUTSIDE_HOURS,
  ERR_RESOURCE_NOT_ALLOWED,
  ERR_RESOURCE_REQUIRED,
  STATUS_BOOKED
} from "./admin.constants.js";

export const TEXT_SCORE = "textScore";
const PHONE_SEARCH_REGEX = /^[\d+()\-\s]+$/;

export function normalizePhone(value: string) {
  return normalizePhoneToE164(value);
}

export function buildAppointmentSearchQuery(search?: string) {
  const trimmed = search?.trim() ?? "";
  if (!trimmed) {
    return { query: {}, useTextScore: false };
  }
  if (PHONE_SEARCH_REGEX.test(trimmed)) {
    return { query: { customerPhone: normalizePhone(trimmed) }, useTextScore: false };
  }
  return { query: { $text: { $search: trimmed } }, useTextScore: true };
}

export async function ensureNoConflicts(params: {
  appointmentModel: Model<Appointment>;
  blockModel: Model<Block>;
  businessId: string;
  startLocal: DateTime;
  durationMinutes: number;
  resourceId?: string;
  ignoreAppointmentId?: string;
}) {
  const { appointmentModel, blockModel, businessId, startLocal, durationMinutes, resourceId } =
    params;
  const startUtc = startLocal.toUTC().toJSDate();
  const endUtc = startLocal.toUTC().plus({ minutes: durationMinutes }).toJSDate();

  const appointmentQuery: Record<string, unknown> = {
    businessId,
    status: STATUS_BOOKED,
    startTime: { $lt: endUtc },
    endTime: { $gt: startUtc }
  };
  if (resourceId) {
    appointmentQuery.resourceId = resourceId;
  }
  if (params.ignoreAppointmentId) {
    appointmentQuery._id = { $ne: params.ignoreAppointmentId };
  }

  const blockQuery: Record<string, unknown> = {
    businessId,
    startTime: { $lt: endUtc },
    endTime: { $gt: startUtc }
  };
  if (resourceId) {
    blockQuery.$or = [{ resourceId }, { resourceId: { $exists: false } }];
  }

  const [appointments, blocks] = await Promise.all([
    appointmentModel.countDocuments(appointmentQuery),
    blockModel.countDocuments(blockQuery)
  ]);

  if (appointments > 0 || blocks > 0) {
    throw new BadRequestException(ERR_APPOINTMENT_CONFLICT);
  }
}

export function assertWithinBusinessHours(
  business: Business,
  startLocal: DateTime,
  durationMinutes: number
) {
  const dayIndex = startLocal.weekday % 7;
  const dayHours = business.hours?.find((hour) => hour.dayOfWeek === dayIndex);
  if (!dayHours) {
    throw new BadRequestException(ERR_OUTSIDE_HOURS);
  }
  const [openHour, openMinute] = dayHours.openTime.split(":").map(Number);
  const [closeHour, closeMinute] = dayHours.closeTime.split(":").map(Number);
  const openLocal = startLocal.set({
    hour: openHour,
    minute: openMinute,
    second: 0,
    millisecond: 0
  });
  const closeLocal = startLocal.set({
    hour: closeHour,
    minute: closeMinute,
    second: 0,
    millisecond: 0
  });
  const endLocal = startLocal.plus({ minutes: durationMinutes });
  if (startLocal < openLocal || endLocal > closeLocal) {
    throw new BadRequestException(ERR_OUTSIDE_HOURS);
  }
}

export function ensureServiceResource(service: Service, resourceId?: string) {
  const allowedResourceIds = (service.allowedResourceIds || []).map((id) => id.toString());
  if (allowedResourceIds.length === 0) {
    return;
  }
  if (!resourceId) {
    throw new BadRequestException(ERR_RESOURCE_REQUIRED);
  }
  if (!allowedResourceIds.includes(resourceId)) {
    throw new BadRequestException(ERR_RESOURCE_NOT_ALLOWED);
  }
}
