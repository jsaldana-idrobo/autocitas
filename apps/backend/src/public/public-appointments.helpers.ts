import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { DateTime } from "luxon";
import { Types, isValidObjectId } from "mongoose";
import type { Model } from "mongoose";
import { Appointment } from "../schemas/appointment.schema.js";
import { Block } from "../schemas/block.schema.js";
import { Business } from "../schemas/business.schema.js";
import { Service } from "../schemas/service.schema.js";
import {
  DEFAULT_TIMEZONE,
  ERR_BUSINESS_NOT_FOUND,
  ERR_INVALID_RESOURCE_ID,
  ERR_INVALID_SERVICE_ID,
  ERR_SERVICE_NOT_FOUND,
  ERR_START_TIME_PAST,
  STATUS_BOOKED,
  assertActiveBusiness,
  parseBusinessHours
} from "./public.service.helpers.js";

export type BusinessWithId = Business & { _id: Types.ObjectId };

export function assertValidObjectId(id: string, errorMessage: string) {
  if (!isValidObjectId(id)) {
    throw new BadRequestException(errorMessage);
  }
}

export async function getActiveBusinessBySlug(businessModel: Model<Business>, slug: string) {
  const business = await businessModel.findOne({ slug }).lean();
  assertActiveBusiness(business);
  return business as BusinessWithId;
}

export async function getActiveService(
  serviceModel: Model<Service>,
  businessId: Types.ObjectId,
  serviceId: string
) {
  if (!isValidObjectId(serviceId)) {
    throw new BadRequestException(ERR_INVALID_SERVICE_ID);
  }

  const service = await serviceModel.findOne({ _id: serviceId, businessId, active: true }).lean();
  if (!service) {
    throw new NotFoundException(ERR_SERVICE_NOT_FOUND);
  }
  return service;
}

export function resolveResourceId(service: Service, payloadResourceId?: string) {
  let resourceId: string | undefined;
  if (payloadResourceId) {
    if (!isValidObjectId(payloadResourceId)) {
      throw new BadRequestException(ERR_INVALID_RESOURCE_ID);
    }
    resourceId = payloadResourceId;
  }

  if (!service.allowedResourceIds?.length) {
    return resourceId;
  }

  const allowedIds = service.allowedResourceIds.map((id) => id.toString());
  if (!resourceId || !allowedIds.includes(resourceId)) {
    throw new BadRequestException(ERR_INVALID_RESOURCE_ID);
  }
  return resourceId;
}

export function resolveAppointmentTimes(business: Business, service: Service, startTime: string) {
  const timezone = business.timezone || DEFAULT_TIMEZONE;
  const startLocal = DateTime.fromISO(startTime, { zone: timezone });
  if (!startLocal.isValid) {
    throw new BadRequestException("Invalid date format.");
  }
  if (startLocal.toUTC() <= DateTime.now().toUTC()) {
    throw new BadRequestException(ERR_START_TIME_PAST);
  }

  const dayIndex = startLocal.weekday % 7;
  const dayHours = business.hours?.find(
    (hour: Business["hours"][number]) => hour.dayOfWeek === dayIndex
  );
  if (!dayHours) {
    throw new BadRequestException(ERR_BUSINESS_NOT_FOUND);
  }

  const { openLocal, closeLocal } = parseBusinessHours(
    startLocal,
    dayHours.openTime,
    dayHours.closeTime
  );

  const endLocal = startLocal.plus({ minutes: service.durationMinutes });
  if (startLocal < openLocal || endLocal > closeLocal) {
    throw new BadRequestException(ERR_START_TIME_PAST);
  }

  return {
    startUtc: startLocal.toUTC(),
    endUtc: endLocal.toUTC()
  };
}

export async function assertNoConflicts(params: {
  appointmentModel: Model<Appointment>;
  blockModel: Model<Block>;
  businessId: Types.ObjectId;
  resourceId: string | undefined;
  startUtc: DateTime;
  endUtc: DateTime;
  excludeAppointmentId?: string;
}) {
  const {
    appointmentModel,
    blockModel,
    businessId,
    resourceId,
    startUtc,
    endUtc,
    excludeAppointmentId
  } = params;

  const appointmentQuery: Record<string, unknown> = {
    businessId,
    status: STATUS_BOOKED,
    startTime: { $lt: endUtc.toJSDate() },
    endTime: { $gt: startUtc.toJSDate() }
  };
  if (resourceId) {
    appointmentQuery.resourceId = resourceId;
  }
  if (excludeAppointmentId) {
    appointmentQuery._id = { $ne: excludeAppointmentId };
  }

  const blockQuery: Record<string, unknown> = {
    businessId,
    startTime: { $lt: endUtc.toJSDate() },
    endTime: { $gt: startUtc.toJSDate() }
  };
  if (resourceId) {
    blockQuery.$or = [{ resourceId }, { resourceId: { $exists: false } }];
  }

  const [appointments, blocks] = await Promise.all([
    appointmentModel.countDocuments(appointmentQuery),
    blockModel.countDocuments(blockQuery)
  ]);
  if (appointments > 0 || blocks > 0) {
    throw new ConflictException("Appointment conflict.");
  }
}

export async function getBusinessAndAppointment(params: {
  businessModel: Model<Business>;
  appointmentModel: Model<Appointment>;
  slug: string;
  appointmentId: string;
  notFoundMessage: string;
}) {
  const { businessModel, appointmentModel, slug, appointmentId, notFoundMessage } = params;
  const business = await getActiveBusinessBySlug(businessModel, slug);
  const appointment = await appointmentModel
    .findOne({ _id: appointmentId, businessId: business._id })
    .lean();
  if (!appointment) {
    throw new NotFoundException(notFoundMessage);
  }
  return { business, appointment };
}

export function assertPhoneMatch(expectedPhone: string, providedPhone: string) {
  const normalized = providedPhone.trim();
  if (expectedPhone !== normalized) {
    throw new BadRequestException("Phone mismatch.");
  }
  return normalized;
}
