import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Model, Types, isValidObjectId } from "mongoose";
import { Appointment } from "../schemas/appointment.schema";
import { Block } from "../schemas/block.schema";
import { Business } from "../schemas/business.schema";
import { Resource } from "../schemas/resource.schema";
import { Service } from "../schemas/service.schema";
import { assertNotInPast, assertSameDayAllowed } from "./policies";
import {
  DEFAULT_TIMEZONE,
  ERR_INVALID_RESOURCE_ID,
  ERR_INVALID_SERVICE_ID,
  ERR_SERVICE_NOT_FOUND,
  STATUS_BOOKED,
  assertActiveBusiness,
  buildAppointmentMap,
  buildBlockMap,
  filterSlotsForToday,
  generateSlots,
  parseBusinessHours,
  parseDate
} from "./public.service.helpers";

export async function getAvailability(
  businessModel: Model<Business>,
  serviceModel: Model<Service>,
  resourceModel: Model<Resource>,
  appointmentModel: Model<Appointment>,
  blockModel: Model<Block>,
  params: { slug: string; date: string; serviceId: string; resourceId?: string }
) {
  const business = await businessModel.findOne({ slug: params.slug }).lean();
  assertActiveBusiness(business);

  const timezone = business.timezone || DEFAULT_TIMEZONE;
  const dateLocal = parseDate(params.date, timezone);
  assertNotInPast(dateLocal, business);
  assertSameDayAllowed(dateLocal, business);

  if (!isValidObjectId(params.serviceId)) {
    throw new BadRequestException(ERR_INVALID_SERVICE_ID);
  }

  const service = await serviceModel
    .findOne({ _id: params.serviceId, businessId: business._id, active: true })
    .lean();
  if (!service) {
    throw new NotFoundException(ERR_SERVICE_NOT_FOUND);
  }

  const dayIndex = dateLocal.weekday % 7;
  const dayHours = business.hours?.find(
    (hour: Business["hours"][number]) => hour.dayOfWeek === dayIndex
  );
  if (!dayHours) {
    return { slots: [] };
  }

  const { openLocal, closeLocal } = parseBusinessHours(
    dateLocal,
    dayHours.openTime,
    dayHours.closeTime
  );

  const resourceQuery: Record<string, unknown> = {
    businessId: business._id,
    active: true
  };
  if (params.resourceId) {
    if (!isValidObjectId(params.resourceId)) {
      throw new BadRequestException(ERR_INVALID_RESOURCE_ID);
    }
    resourceQuery._id = params.resourceId;
  }
  if (service.allowedResourceIds?.length) {
    resourceQuery._id = { $in: service.allowedResourceIds };
  }

  const [resources, appointments, blocks] = await Promise.all([
    resourceModel.find(resourceQuery).lean(),
    appointmentModel
      .find({
        businessId: business._id,
        status: STATUS_BOOKED,
        startTime: { $lt: closeLocal.toUTC().toJSDate() },
        endTime: { $gt: openLocal.toUTC().toJSDate() }
      })
      .lean(),
    blockModel
      .find({
        businessId: business._id,
        startTime: { $lt: closeLocal.toUTC().toJSDate() },
        endTime: { $gt: openLocal.toUTC().toJSDate() }
      })
      .lean()
  ]);

  const appointmentMap = buildAppointmentMap(appointments);
  const blockMap = buildBlockMap(blocks);

  const slots = generateSlots({
    openLocal,
    closeLocal,
    durationMinutes: service.durationMinutes,
    resources: resources as unknown as (Resource & { _id: Types.ObjectId })[],
    appointmentMap,
    blockMap
  });

  return {
    slots: filterSlotsForToday(slots, dateLocal, timezone)
  };
}
