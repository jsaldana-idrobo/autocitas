import { BadRequestException } from "@nestjs/common";
import { DateTime } from "luxon";
import type { Model } from "mongoose";
import { Appointment } from "../schemas/appointment.schema.js";
import { Business } from "../schemas/business.schema.js";
import { CancelAppointmentDto } from "./dto/cancel-appointment.dto.js";
import { UpdatePublicAppointmentDto } from "./dto/update-public-appointment.dto.js";
import { normalizePhoneToE164 } from "../shared/phone.utils.js";
import {
  DEFAULT_TIMEZONE,
  ERR_APPOINTMENT_NOT_FOUND,
  ERR_CANCEL_WINDOW,
  ERR_INVALID_APPOINTMENT_ID
} from "./public.service.helpers.js";
import {
  assertPhoneMatch,
  assertValidObjectId,
  getBusinessAndAppointment
} from "./public-appointments.helpers.js";

export async function cancelAppointment(
  businessModel: Model<Business>,
  appointmentModel: Model<Appointment>,
  slug: string,
  appointmentId: string,
  payload: CancelAppointmentDto
) {
  assertValidObjectId(appointmentId, ERR_INVALID_APPOINTMENT_ID);

  const { business, appointment } = await getBusinessAndAppointment({
    businessModel,
    appointmentModel,
    slug,
    appointmentId,
    notFoundMessage: ERR_APPOINTMENT_NOT_FOUND
  });

  assertPhoneMatch(appointment.customerPhone, payload.customerPhone);

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
  assertValidObjectId(appointmentId, ERR_INVALID_APPOINTMENT_ID);

  const { appointment } = await getBusinessAndAppointment({
    businessModel,
    appointmentModel,
    slug,
    appointmentId,
    notFoundMessage: ERR_APPOINTMENT_NOT_FOUND
  });

  assertPhoneMatch(appointment.customerPhone, payload.customerPhone);

  const update: Record<string, unknown> = {};
  if (payload.customerName) update.customerName = payload.customerName;
  if (payload.newCustomerPhone) {
    update.customerPhone = normalizePhoneToE164(payload.newCustomerPhone);
  }
  if (Object.keys(update).length === 0) {
    throw new BadRequestException("No updates provided.");
  }

  await appointmentModel.updateOne({ _id: appointmentId }, update);

  return { status: "ok" };
}
