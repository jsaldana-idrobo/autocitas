import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { DateTime } from "luxon";
import { Model, isValidObjectId } from "mongoose";
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

export async function createAppointment(
  businessModel: Model<Business>,
  serviceModel: Model<Service>,
  appointmentModel: Model<Appointment>,
  blockModel: Model<Block>,
  slug: string,
  payload: CreateAppointmentDto
) {
  const business = await businessModel.findOne({ slug }).lean();
  assertActiveBusiness(business);

  if (!isValidObjectId(payload.serviceId)) {
    throw new BadRequestException(ERR_INVALID_SERVICE_ID);
  }

  const service = await serviceModel
    .findOne({ _id: payload.serviceId, businessId: business._id, active: true })
    .lean();
  if (!service) {
    throw new NotFoundException(ERR_SERVICE_NOT_FOUND);
  }

  let resourceId: string | undefined;
  if (payload.resourceId) {
    if (!isValidObjectId(payload.resourceId)) {
      throw new BadRequestException(ERR_INVALID_RESOURCE_ID);
    }
    resourceId = payload.resourceId;
  }
  if (service.allowedResourceIds?.length) {
    const allowedIds = service.allowedResourceIds.map((id) => id.toString());
    if (!resourceId) {
      throw new BadRequestException(ERR_INVALID_RESOURCE_ID);
    }
    if (!allowedIds.includes(resourceId)) {
      throw new BadRequestException(ERR_INVALID_RESOURCE_ID);
    }
  }

  const timezone = business.timezone || DEFAULT_TIMEZONE;
  const startLocal = DateTime.fromISO(payload.startTime, { zone: timezone });
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

  const startUtc = startLocal.toUTC();
  const endUtc = endLocal.toUTC();

  const appointmentQuery: Record<string, unknown> = {
    businessId: business._id,
    status: STATUS_BOOKED,
    startTime: { $lt: endUtc.toJSDate() },
    endTime: { $gt: startUtc.toJSDate() }
  };
  if (resourceId) {
    appointmentQuery.resourceId = resourceId;
  }

  const blockQuery: Record<string, unknown> = {
    businessId: business._id,
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
