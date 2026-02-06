import type { Model } from "mongoose";
import { Appointment } from "../schemas/appointment.schema.js";
import { Block } from "../schemas/block.schema.js";
import { Business } from "../schemas/business.schema.js";
import { Service } from "../schemas/service.schema.js";
import { CreateAppointmentDto } from "./dto/create-appointment.dto.js";
import { STATUS_BOOKED } from "./public.service.helpers.js";
import {
  assertNoConflicts,
  getActiveBusinessBySlug,
  getActiveService,
  resolveAppointmentTimes,
  resolveResourceId
} from "./public-appointments.helpers.js";

export async function createAppointment(
  businessModel: Model<Business>,
  serviceModel: Model<Service>,
  appointmentModel: Model<Appointment>,
  blockModel: Model<Block>,
  slug: string,
  payload: CreateAppointmentDto
) {
  const business = await getActiveBusinessBySlug(businessModel, slug);
  const service = await getActiveService(serviceModel, business._id, payload.serviceId);
  const resourceId = resolveResourceId(service, payload.resourceId);
  const { startUtc, endUtc } = resolveAppointmentTimes(business, service, payload.startTime);

  await assertNoConflicts({
    appointmentModel,
    blockModel,
    businessId: business._id,
    resourceId,
    startUtc,
    endUtc
  });

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
