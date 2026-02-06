import { BadRequestException, NotFoundException } from "@nestjs/common";
import { DateTime } from "luxon";
import { Model, isValidObjectId } from "mongoose";
import { Appointment } from "../schemas/appointment.schema";
import { Business } from "../schemas/business.schema";
import { CancelAppointmentDto } from "./dto/cancel-appointment.dto";
import { UpdatePublicAppointmentDto } from "./dto/update-public-appointment.dto";
import {
  DEFAULT_TIMEZONE,
  ERR_APPOINTMENT_NOT_FOUND,
  ERR_CANCEL_WINDOW,
  ERR_INVALID_APPOINTMENT_ID,
  assertActiveBusiness
} from "./public.service.helpers";

export async function cancelAppointment(
  businessModel: Model<Business>,
  appointmentModel: Model<Appointment>,
  slug: string,
  appointmentId: string,
  payload: CancelAppointmentDto
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

  const normalizedPayloadPhone = payload.customerPhone.trim();
  if (appointment.customerPhone !== normalizedPayloadPhone) {
    throw new BadRequestException("Phone mismatch.");
  }

  const timezone = business.timezone || DEFAULT_TIMEZONE;
  const now = DateTime.now().setZone(timezone);
  const start = DateTime.fromJSDate(appointment.startTime).setZone(timezone);
  const cancellationHours = business.policies?.cancellationHours ?? 24;
  if (start.diff(now, "hours").hours < cancellationHours) {
    throw new BadRequestException(ERR_CANCEL_WINDOW);
  }

  await appointmentModel.updateOne({ _id: appointmentId }, { status: "cancelled" });

  return { status: "ok" };
}

export async function updatePublicAppointment(
  businessModel: Model<Business>,
  appointmentModel: Model<Appointment>,
  slug: string,
  appointmentId: string,
  payload: UpdatePublicAppointmentDto
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

  const normalizedPayloadPhone = payload.customerPhone.trim();
  if (appointment.customerPhone !== normalizedPayloadPhone) {
    throw new BadRequestException("Phone mismatch.");
  }

  const update: Record<string, unknown> = {};
  if (payload.customerName) update.customerName = payload.customerName;
  if (payload.newCustomerPhone) update.customerPhone = payload.newCustomerPhone.trim();
  if (Object.keys(update).length === 0) {
    throw new BadRequestException("No updates provided.");
  }

  await appointmentModel.updateOne({ _id: appointmentId }, update);

  return { status: "ok" };
}
