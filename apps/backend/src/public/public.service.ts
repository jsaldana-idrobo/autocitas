import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { DateTime } from "luxon";
import { Model, Types, isValidObjectId } from "mongoose";
import { Appointment } from "../schemas/appointment.schema";
import { Block } from "../schemas/block.schema";
import { Business } from "../schemas/business.schema";
import { Resource } from "../schemas/resource.schema";
import { Service } from "../schemas/service.schema";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { assertNotInPast, assertSameDayAllowed } from "./policies";

const DEFAULT_TIMEZONE = "America/Bogota";
const STATUS_ACTIVE = "active";
const STATUS_BOOKED = "booked";

interface SlotAvailability {
  startTime: string;
  endTime: string;
  resourceIds: string[];
}

interface TimeInterval {
  start: number;
  end: number;
}

type ResourceWithId = Resource & { _id: Types.ObjectId };

function parseDate(date: string, timezone: string) {
  const dateLocal = DateTime.fromISO(date, { zone: timezone });
  if (!dateLocal.isValid) {
    throw new BadRequestException("Invalid date format. Use YYYY-MM-DD.");
  }
  return dateLocal;
}

function parseBusinessHours(dateLocal: DateTime, openTime: string, closeTime: string) {
  const openParts = openTime.split(":").map(Number);
  const closeParts = closeTime.split(":").map(Number);
  if (openParts.length !== 2 || closeParts.length !== 2) {
    throw new BadRequestException("Invalid business hours configuration.");
  }

  const openLocal = dateLocal.set({
    hour: openParts[0],
    minute: openParts[1],
    second: 0,
    millisecond: 0
  });
  const closeLocal = dateLocal.set({
    hour: closeParts[0],
    minute: closeParts[1],
    second: 0,
    millisecond: 0
  });

  return { openLocal, closeLocal };
}

function buildAppointmentMap(appointments: Appointment[]) {
  const appointmentMap = new Map<string, TimeInterval[]>();
  for (const appt of appointments) {
    if (!appt.resourceId) continue;
    const key = appt.resourceId.toString();
    const list = appointmentMap.get(key) ?? [];
    list.push({ start: appt.startTime.getTime(), end: appt.endTime.getTime() });
    appointmentMap.set(key, list);
  }
  return appointmentMap;
}

function buildBlockMap(blocks: Block[]) {
  const blockMap = new Map<string, TimeInterval[]>();
  for (const block of blocks) {
    const key = block.resourceId ? block.resourceId.toString() : "*";
    const list = blockMap.get(key) ?? [];
    list.push({ start: block.startTime.getTime(), end: block.endTime.getTime() });
    blockMap.set(key, list);
  }
  return blockMap;
}

function generateSlots(params: {
  openLocal: DateTime;
  closeLocal: DateTime;
  durationMinutes: number;
  resources: ResourceWithId[];
  appointmentMap: Map<string, TimeInterval[]>;
  blockMap: Map<string, TimeInterval[]>;
}) {
  const slotMap = new Map<string, SlotAvailability>();

  for (const resource of params.resources) {
    const resourceId = resource._id.toString();
    const resourceAppointments = params.appointmentMap.get(resourceId) ?? [];
    const resourceBlocks = params.blockMap.get(resourceId) ?? [];
    const globalBlocks = params.blockMap.get("*") ?? [];
    const intervals = [...resourceAppointments, ...resourceBlocks, ...globalBlocks];

    let cursor = params.openLocal;
    while (cursor.plus({ minutes: params.durationMinutes }) <= params.closeLocal) {
      const slotStartLocal = cursor;
      const slotEndLocal = cursor.plus({ minutes: params.durationMinutes });
      const slotStartUtc = slotStartLocal.toUTC().toJSDate();
      const slotEndUtc = slotEndLocal.toUTC().toJSDate();
      const slotStartMs = slotStartUtc.getTime();
      const slotEndMs = slotEndUtc.getTime();

      const hasConflict = intervals.some(
        (interval) => interval.start < slotEndMs && interval.end > slotStartMs
      );

      if (!hasConflict) {
        const key = slotStartUtc.toISOString();
        const existing = slotMap.get(key);
        if (existing) {
          existing.resourceIds.push(resourceId);
        } else {
          slotMap.set(key, {
            startTime: slotStartUtc.toISOString(),
            endTime: slotEndUtc.toISOString(),
            resourceIds: [resourceId]
          });
        }
      }

      cursor = cursor.plus({ minutes: params.durationMinutes });
    }
  }

  return Array.from(slotMap.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export class PublicService {
  constructor(
    @InjectModel(Business.name) private readonly businessModel: Model<Business>,
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
    @InjectModel(Resource.name) private readonly resourceModel: Model<Resource>,
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<Appointment>,
    @InjectModel(Block.name) private readonly blockModel: Model<Block>
  ) {}

  async getPublicBusiness(slug: string) {
    const business = await this.businessModel.findOne({ slug }).lean();
    if (!business || business.status !== STATUS_ACTIVE) {
      throw new NotFoundException("Business not found");
    }

    const [services, resources] = await Promise.all([
      this.serviceModel.find({ businessId: business._id, active: true }).lean(),
      this.resourceModel.find({ businessId: business._id, active: true }).lean()
    ]);

    return {
      business,
      services,
      resources
    };
  }

  async getAvailability(params: {
    slug: string;
    date: string;
    serviceId: string;
    resourceId?: string;
  }) {
    const business = await this.businessModel.findOne({ slug: params.slug }).lean();
    if (!business || business.status !== STATUS_ACTIVE) {
      throw new NotFoundException("Business not found");
    }

    const timezone = business.timezone || DEFAULT_TIMEZONE;
    const dateLocal = parseDate(params.date, timezone);
    assertNotInPast(dateLocal, business);
    assertSameDayAllowed(dateLocal, business);

    if (!isValidObjectId(params.serviceId)) {
      throw new BadRequestException("Invalid serviceId.");
    }

    const service = await this.serviceModel
      .findOne({ _id: params.serviceId, businessId: business._id, active: true })
      .lean();
    if (!service) {
      throw new NotFoundException("Service not found");
    }

    const dayIndex = dateLocal.weekday % 7;
    const dayHours = business.hours?.find(
      (hour: Business["hours"][number]) => hour.dayOfWeek === dayIndex
    );
    if (!dayHours) {
      return { slots: [] };
    }

    const { openLocal, closeLocal } = parseBusinessHours(dateLocal, dayHours.openTime, dayHours.closeTime);
    if (closeLocal <= openLocal) {
      return { slots: [] };
    }

    const durationMinutes = service.durationMinutes;
    const allowedResourceIds = (service.allowedResourceIds || []).map(
      (id: Types.ObjectId | string) => id.toString()
    );

    if (params.resourceId && !isValidObjectId(params.resourceId)) {
      throw new BadRequestException("Invalid resourceId.");
    }

    const resourceQuery: Record<string, unknown> = {
      businessId: business._id,
      active: true
    };

    if (allowedResourceIds.length > 0) {
      resourceQuery._id = { $in: allowedResourceIds };
    }

    if (params.resourceId) {
      resourceQuery._id = params.resourceId;
    }

    const resources = (await this.resourceModel.find(resourceQuery).lean()) as ResourceWithId[];
    if (params.resourceId && resources.length === 0) {
      throw new NotFoundException("Resource not found for this service.");
    }

    const rangeStartUtc = openLocal.toUTC().toJSDate();
    const rangeEndUtc = closeLocal.toUTC().toJSDate();

    const [appointments, blocks] = await Promise.all([
      this.appointmentModel
        .find({
          businessId: business._id,
          status: STATUS_BOOKED,
          startTime: { $lt: rangeEndUtc },
          endTime: { $gt: rangeStartUtc }
        })
        .lean(),
      this.blockModel
        .find({
          businessId: business._id,
          startTime: { $lt: rangeEndUtc },
          endTime: { $gt: rangeStartUtc }
        })
        .lean()
    ]);

    const appointmentMap = buildAppointmentMap(appointments);
    const blockMap = buildBlockMap(blocks);

    const slots = generateSlots({
      openLocal,
      closeLocal,
      durationMinutes,
      resources,
      appointmentMap,
      blockMap
    });

    return { slots };
  }

  async createAppointment(slug: string, payload: CreateAppointmentDto) {
    const business = await this.businessModel.findOne({ slug }).lean();
    if (!business || business.status !== STATUS_ACTIVE) {
      throw new NotFoundException("Business not found");
    }

    if (!isValidObjectId(payload.serviceId)) {
      throw new BadRequestException("Invalid serviceId.");
    }

    if (payload.resourceId && !isValidObjectId(payload.resourceId)) {
      throw new BadRequestException("Invalid resourceId.");
    }

    const service = await this.serviceModel
      .findOne({ _id: payload.serviceId, businessId: business._id, active: true })
      .lean();
    if (!service) {
      throw new NotFoundException("Service not found");
    }

    const timezone = business.timezone || DEFAULT_TIMEZONE;
    const startLocal = DateTime.fromISO(payload.startTime, { zone: timezone });
    if (!startLocal.isValid) {
      throw new BadRequestException("Invalid startTime format.");
    }
    assertNotInPast(startLocal.startOf("day"), business);
    assertSameDayAllowed(startLocal, business);

    const startUtc = startLocal.toUTC();
    const endUtc = startUtc.plus({ minutes: service.durationMinutes });

    const availability = await this.getAvailability({
      slug,
      date: startLocal.toISODate() ?? "",
      serviceId: payload.serviceId,
      resourceId: payload.resourceId
    });

    const slot = availability.slots.find((item) => item.startTime === startUtc.toISO());
    if (!slot) {
      throw new ConflictException("Selected time is no longer available.");
    }

    const resourceId = payload.resourceId || slot.resourceIds[0];
    if (!resourceId) {
      throw new ConflictException("No resource available for selected time.");
    }

    const created = await this.appointmentModel.create({
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
}
