import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Model } from "mongoose";
import { Appointment } from "../schemas/appointment.schema";
import { Block } from "../schemas/block.schema";
import { Business } from "../schemas/business.schema";
import { Service } from "../schemas/service.schema";
import { RescheduleAppointmentDto } from "./dto/reschedule-appointment.dto";
import {
  ERR_APPOINTMENT_NOT_FOUND,
  ERR_INVALID_APPOINTMENT_ID,
  ERR_RESCHEDULE_LIMIT,
  ERR_SERVICE_NOT_FOUND
} from "./public.service.helpers";
import {
  assertNoConflicts,
  assertPhoneMatch,
  assertValidObjectId,
  getBusinessAndAppointment,
  resolveAppointmentTimes
} from "./public-appointments.helpers";

export async function rescheduleAppointment(
  businessModel: Model<Business>,
  serviceModel: Model<Service>,
  appointmentModel: Model<Appointment>,
  blockModel: Model<Block>,
  slug: string,
  appointmentId: string,
  payload: RescheduleAppointmentDto
) {
  assertValidObjectId(appointmentId, ERR_INVALID_APPOINTMENT_ID);

  const { business, appointment } = await getBusinessAndAppointment({
    businessModel,
    appointmentModel,
    slug,
    appointmentId,
    notFoundMessage: ERR_APPOINTMENT_NOT_FOUND
  });

  if (appointment.rescheduleCount && appointment.rescheduleCount >= 1) {
    throw new BadRequestException(ERR_RESCHEDULE_LIMIT);
  }

  assertPhoneMatch(appointment.customerPhone, payload.customerPhone);

  const service = await serviceModel
    .findOne({ _id: appointment.serviceId, businessId: business._id })
    .lean();
  if (!service) {
    throw new NotFoundException(ERR_SERVICE_NOT_FOUND);
  }

  const { startUtc, endUtc } = resolveAppointmentTimes(business, service, payload.startTime);

  await assertNoConflicts({
    appointmentModel,
    blockModel,
    businessId: business._id,
    resourceId: appointment.resourceId,
    startUtc,
    endUtc,
    excludeAppointmentId: appointmentId
  });

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
