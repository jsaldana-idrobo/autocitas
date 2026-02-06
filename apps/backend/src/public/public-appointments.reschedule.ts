import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { DateTime } from "luxon";
import { Model, isValidObjectId } from "mongoose";
import { Appointment } from "../schemas/appointment.schema";
import { Block } from "../schemas/block.schema";
import { Business } from "../schemas/business.schema";
import { Service } from "../schemas/service.schema";
import { RescheduleAppointmentDto } from "./dto/reschedule-appointment.dto";
import {
  DEFAULT_TIMEZONE,
  ERR_APPOINTMENT_NOT_FOUND,
  ERR_BUSINESS_NOT_FOUND,
  ERR_INVALID_APPOINTMENT_ID,
  ERR_RESCHEDULE_LIMIT,
  ERR_SERVICE_NOT_FOUND,
  ERR_START_TIME_PAST,
  STATUS_BOOKED,
  assertActiveBusiness,
  parseBusinessHours
} from "./public.service.helpers";

export async function rescheduleAppointment(
  businessModel: Model<Business>,
  serviceModel: Model<Service>,
  appointmentModel: Model<Appointment>,
  blockModel: Model<Block>,
  slug: string,
  appointmentId: string,
  payload: RescheduleAppointmentDto
) {
  if (!isValidObjectId(appointmentId)) {
    throw new BadRequestException(ERR_INVALID_APPOINTMENT_ID);
  }

  const business = await businessModel.findOne({ slug }).lean();
  assertActiveBusiness(business);

  const appointment = await appointmentModel
    .findOne({ _id: appointmentId, businessId: business._id })
    .lean();
  if (!appointment) {
    throw new NotFoundException(ERR_APPOINTMENT_NOT_FOUND);
  }

  if (appointment.rescheduleCount && appointment.rescheduleCount >= 1) {
    throw new BadRequestException(ERR_RESCHEDULE_LIMIT);
  }

  const normalizedPayloadPhone = payload.customerPhone.trim();
  if (appointment.customerPhone !== normalizedPayloadPhone) {
    throw new BadRequestException("Phone mismatch.");
  }

  const timezone = business.timezone || DEFAULT_TIMEZONE;
  const startLocal = DateTime.fromISO(payload.startTime, { zone: timezone });
  if (!startLocal.isValid) {
    throw new BadRequestException("Invalid date format.");
  }

  if (startLocal.toUTC() <= DateTime.now().toUTC()) {
    throw new BadRequestException(ERR_START_TIME_PAST);
  }

  const service = await serviceModel
    .findOne({ _id: appointment.serviceId, businessId: business._id })
    .lean();
  if (!service) {
    throw new NotFoundException(ERR_SERVICE_NOT_FOUND);
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
    endTime: { $gt: startUtc.toJSDate() },
    _id: { $ne: appointmentId }
  };
  if (appointment.resourceId) {
    appointmentQuery.resourceId = appointment.resourceId;
  }

  const blockQuery: Record<string, unknown> = {
    businessId: business._id,
    startTime: { $lt: endUtc.toJSDate() },
    endTime: { $gt: startUtc.toJSDate() }
  };
  if (appointment.resourceId) {
    blockQuery.$or = [{ resourceId: appointment.resourceId }, { resourceId: { $exists: false } }];
  }

  const [appointments, blocks] = await Promise.all([
    appointmentModel.countDocuments(appointmentQuery),
    blockModel.countDocuments(blockQuery)
  ]);
  if (appointments > 0 || blocks > 0) {
    throw new ConflictException("Appointment conflict.");
  }

  appointment.startTime = startUtc.toJSDate();
  appointment.endTime = endUtc.toJSDate();
  appointment.rescheduleCount = (appointment.rescheduleCount ?? 0) + 1;

  await appointmentModel.updateOne(
    { _id: appointmentId },
    {
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      rescheduleCount: appointment.rescheduleCount
    }
  );

  return { status: "ok" };
}
