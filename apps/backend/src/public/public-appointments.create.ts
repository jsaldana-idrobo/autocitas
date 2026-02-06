import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { DateTime } from "luxon";
import { Model, Types, isValidObjectId } from "mongoose";
import { Appointment } from "../schemas/appointment.schema";
import { Block } from "../schemas/block.schema";
import { Business } from "../schemas/business.schema";
import { Service } from "../schemas/service.schema";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
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
} from "./public.service.helpers";

type BusinessWithId = Business & { _id: Types.ObjectId };

export async function createAppointment(
  businessModel: Model<Business>,
  serviceModel: Model<Service>,
  appointmentModel: Model<Appointment>,
  blockModel: Model<Block>,
  slug: string,
  payload: CreateAppointmentDto
) {
  const business = await getBusinessBySlug(businessModel, slug);
  const service = await getActiveService(serviceModel, business._id, payload.serviceId);
  const resourceId = resolveResourceId(service, payload.resourceId);
  const { startUtc, endUtc } = resolveAppointmentTimes(business, service, payload.startTime);

  await assertNoConflicts(appointmentModel, blockModel, business._id, resourceId, startUtc, endUtc);

  const created = await appointmentModel.create({
    businessId: business._id,
    serviceId: service._id,
    resourceId,
    customerName: payload.customerName.trim(),
    customerPhone: payload.customerPhone.trim(),
    startTime: startUtc.toJSDate(),
    endTime: endUtc.toJSDate(),
    status: STATUS_BOOKED
  });

  return {
    appointmentId: created._id,
    startTime: created.startTime,
    endTime: created.endTime,
    resourceId: created.resourceId
  };
}

async function getBusinessBySlug(businessModel: Model<Business>, slug: string) {
  const business = await businessModel.findOne({ slug }).lean();
  assertActiveBusiness(business);
  return business as BusinessWithId;
}

async function getActiveService(
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

function resolveResourceId(service: Service, payloadResourceId?: string) {
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

function resolveAppointmentTimes(business: Business, service: Service, startTime: string) {
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

async function assertNoConflicts(
  appointmentModel: Model<Appointment>,
  blockModel: Model<Block>,
  businessId: Types.ObjectId,
  resourceId: string | undefined,
  startUtc: DateTime,
  endUtc: DateTime
) {
  const appointmentQuery: Record<string, unknown> = {
    businessId,
    status: STATUS_BOOKED,
    startTime: { $lt: endUtc.toJSDate() },
    endTime: { $gt: startUtc.toJSDate() }
  };
  if (resourceId) {
    appointmentQuery.resourceId = resourceId;
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
