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
import { CancelAppointmentDto } from "./dto/cancel-appointment.dto";
import { RescheduleAppointmentDto } from "./dto/reschedule-appointment.dto";
import { UpdatePublicAppointmentDto } from "./dto/update-public-appointment.dto";
import { assertNotInPast, assertSameDayAllowed } from "./policies";

const DEFAULT_TIMEZONE = "America/Bogota";
const STATUS_ACTIVE = "active";
const STATUS_BOOKED = "booked";
const ERR_BUSINESS_NOT_FOUND = "Business not found";
const ERR_INVALID_SERVICE_ID = "Invalid serviceId.";
const ERR_INVALID_RESOURCE_ID = "Invalid resourceId.";
const ERR_SERVICE_NOT_FOUND = "Service not found";
const ERR_START_TIME_PAST = "Start time must be in the future.";
const ERR_APPOINTMENT_NOT_FOUND = "Appointment not found";
const ERR_CANCEL_WINDOW = "Cancellation window has passed.";
const ERR_RESCHEDULE_LIMIT = "Reschedule limit reached.";

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

function filterSlotsForToday(slots: SlotAvailability[], dateLocal: DateTime, timezone: string) {
  const now = DateTime.now().setZone(timezone);
  if (!dateLocal.hasSame(now, "day")) {
    return slots;
  }
  const nowUtcMillis = now.toUTC().toMillis();
  return slots.filter((slot) => DateTime.fromISO(slot.startTime).toMillis() > nowUtcMillis);
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
      throw new NotFoundException(ERR_BUSINESS_NOT_FOUND);
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
      throw new NotFoundException(ERR_BUSINESS_NOT_FOUND);
    }

    const timezone = business.timezone || DEFAULT_TIMEZONE;
    const dateLocal = parseDate(params.date, timezone);
    assertNotInPast(dateLocal, business);
    assertSameDayAllowed(dateLocal, business);

    if (!isValidObjectId(params.serviceId)) {
      throw new BadRequestException(ERR_INVALID_SERVICE_ID);
    }

    const service = await this.serviceModel
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
    if (closeLocal <= openLocal) {
      return { slots: [] };
    }

    const durationMinutes = service.durationMinutes;
    const allowedResourceIds = (service.allowedResourceIds || []).map(
      (id: Types.ObjectId | string) => id.toString()
    );

    if (params.resourceId && !isValidObjectId(params.resourceId)) {
      throw new BadRequestException(ERR_INVALID_RESOURCE_ID);
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

    const filtered = filterSlotsForToday(slots, dateLocal, timezone);
    return { slots: filtered };
  }

  async createAppointment(slug: string, payload: CreateAppointmentDto) {
    const business = await this.businessModel.findOne({ slug }).lean();
    if (!business || business.status !== STATUS_ACTIVE) {
      throw new NotFoundException(ERR_BUSINESS_NOT_FOUND);
    }

    if (!isValidObjectId(payload.serviceId)) {
      throw new BadRequestException(ERR_INVALID_SERVICE_ID);
    }

    if (payload.resourceId && !isValidObjectId(payload.resourceId)) {
      throw new BadRequestException(ERR_INVALID_RESOURCE_ID);
    }

    const service = await this.serviceModel
      .findOne({ _id: payload.serviceId, businessId: business._id, active: true })
      .lean();
    if (!service) {
      throw new NotFoundException(ERR_SERVICE_NOT_FOUND);
    }

    const timezone = business.timezone || DEFAULT_TIMEZONE;
    const startLocal = DateTime.fromISO(payload.startTime, { zone: timezone });
    if (!startLocal.isValid) {
      throw new BadRequestException("Invalid startTime format.");
    }
    assertNotInPast(startLocal.startOf("day"), business);
    assertSameDayAllowed(startLocal, business);
    const nowLocal = DateTime.now().setZone(timezone);
    if (startLocal <= nowLocal) {
      throw new BadRequestException(ERR_START_TIME_PAST);
    }

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

  async listAppointmentsByPhone(slug: string, phone?: string) {
    const business = await this.businessModel.findOne({ slug }).lean();
    if (!business || business.status !== STATUS_ACTIVE) {
      throw new NotFoundException(ERR_BUSINESS_NOT_FOUND);
    }
    const normalized = (phone || "").trim();
    if (!normalized) {
      return { appointments: [] };
    }
    const appointments = await this.appointmentModel
      .find({ businessId: business._id, customerPhone: normalized })
      .sort({ startTime: -1 })
      .limit(50)
      .lean();
    return { appointments };
  }

  async cancelAppointment(slug: string, appointmentId: string, payload: CancelAppointmentDto) {
    const business = await this.businessModel.findOne({ slug }).lean();
    if (!business || business.status !== STATUS_ACTIVE) {
      throw new NotFoundException(ERR_BUSINESS_NOT_FOUND);
    }

    if (!isValidObjectId(appointmentId)) {
      throw new BadRequestException("Invalid appointmentId.");
    }

    const phone = payload.customerPhone.trim();
    const appointment = await this.appointmentModel
      .findOne({ _id: appointmentId, businessId: business._id, customerPhone: phone })
      .lean();

    if (!appointment) {
      throw new NotFoundException(ERR_APPOINTMENT_NOT_FOUND);
    }

    const timezone = business.timezone || DEFAULT_TIMEZONE;
    const now = DateTime.now().setZone(timezone);
    const start = DateTime.fromJSDate(appointment.startTime).setZone(timezone);
    const cancellationHours = business.policies?.cancellationHours ?? 24;
    if (start.diff(now, "hours").hours < cancellationHours) {
      throw new BadRequestException(ERR_CANCEL_WINDOW);
    }

    const updated = await this.appointmentModel
      .findOneAndUpdate({ _id: appointment._id }, { status: "cancelled" }, { new: true })
      .lean();

    return {
      appointmentId: updated?._id ?? appointment._id,
      status: "cancelled"
    };
  }

  async rescheduleAppointment(
    slug: string,
    appointmentId: string,
    payload: RescheduleAppointmentDto
  ) {
    const business = await this.businessModel.findOne({ slug }).lean();
    if (!business || business.status !== STATUS_ACTIVE) {
      throw new NotFoundException(ERR_BUSINESS_NOT_FOUND);
    }

    if (!isValidObjectId(appointmentId)) {
      throw new BadRequestException("Invalid appointmentId.");
    }

    const phone = payload.customerPhone.trim();
    const appointment = await this.appointmentModel
      .findOne({ _id: appointmentId, businessId: business._id, customerPhone: phone })
      .lean();

    if (!appointment) {
      throw new NotFoundException(ERR_APPOINTMENT_NOT_FOUND);
    }

    const rescheduleLimit = business.policies?.rescheduleLimit ?? 1;
    if ((appointment.rescheduleCount ?? 0) >= rescheduleLimit) {
      throw new BadRequestException(ERR_RESCHEDULE_LIMIT);
    }

    const timezone = business.timezone || DEFAULT_TIMEZONE;
    const startLocal = DateTime.fromISO(payload.startTime, { zone: timezone });
    if (!startLocal.isValid) {
      throw new BadRequestException("Invalid startTime format.");
    }
    assertNotInPast(startLocal.startOf("day"), business);
    assertSameDayAllowed(startLocal, business);

    const nowLocal = DateTime.now().setZone(timezone);
    if (startLocal <= nowLocal) {
      throw new BadRequestException(ERR_START_TIME_PAST);
    }

    const availability = await this.getAvailability({
      slug,
      date: startLocal.toISODate() ?? "",
      serviceId: appointment.serviceId.toString(),
      resourceId: appointment.resourceId?.toString()
    });

    const startUtc = startLocal.toUTC();
    const slot = availability.slots.find((item) => item.startTime === startUtc.toISO());
    if (!slot) {
      throw new ConflictException("Selected time is no longer available.");
    }

    const resourceId = appointment.resourceId?.toString() || slot.resourceIds[0];
    if (!resourceId) {
      throw new ConflictException("No resource available for selected time.");
    }

    const durationMinutes = Math.round(
      (appointment.endTime.getTime() - appointment.startTime.getTime()) / 60000
    );
    const endUtc = startUtc.plus({ minutes: durationMinutes });
    const updated = await this.appointmentModel
      .findOneAndUpdate(
        { _id: appointment._id },
        {
          startTime: startUtc.toJSDate(),
          endTime: endUtc.toJSDate(),
          resourceId,
          rescheduleCount: (appointment.rescheduleCount ?? 0) + 1,
          lastRescheduledAt: new Date()
        },
        { new: true }
      )
      .lean();

    return {
      appointmentId: updated?._id ?? appointment._id,
      startTime: updated?.startTime ?? startUtc.toJSDate(),
      endTime: updated?.endTime ?? endUtc.toJSDate(),
      resourceId: updated?.resourceId ?? resourceId
    };
  }

  async updatePublicAppointment(
    slug: string,
    appointmentId: string,
    payload: UpdatePublicAppointmentDto
  ) {
    const business = await this.businessModel.findOne({ slug }).lean();
    if (!business || business.status !== STATUS_ACTIVE) {
      throw new NotFoundException(ERR_BUSINESS_NOT_FOUND);
    }

    if (!isValidObjectId(appointmentId)) {
      throw new BadRequestException("Invalid appointmentId.");
    }

    const phone = payload.customerPhone.trim();
    const appointment = await this.appointmentModel
      .findOne({ _id: appointmentId, businessId: business._id, customerPhone: phone })
      .lean();

    if (!appointment) {
      throw new NotFoundException(ERR_APPOINTMENT_NOT_FOUND);
    }

    const update: Record<string, unknown> = {};
    if (payload.customerName && payload.customerName.trim()) {
      update.customerName = payload.customerName.trim();
    }
    if (payload.newCustomerPhone && payload.newCustomerPhone.trim()) {
      update.customerPhone = payload.newCustomerPhone.trim();
    }

    if (payload.startTime) {
      const rescheduled = await this.rescheduleAppointment(slug, appointmentId, {
        customerPhone: payload.customerPhone,
        startTime: payload.startTime
      });
      return {
        appointmentId: rescheduled.appointmentId,
        startTime: rescheduled.startTime,
        endTime: rescheduled.endTime,
        resourceId: rescheduled.resourceId,
        updatedFields: Object.keys(update)
      };
    }

    if (Object.keys(update).length === 0) {
      throw new BadRequestException("No updates provided.");
    }

    const updated = await this.appointmentModel
      .findOneAndUpdate({ _id: appointment._id }, { $set: update }, { new: true })
      .lean();

    return {
      appointmentId: updated?._id ?? appointment._id,
      startTime: updated?.startTime ?? appointment.startTime,
      endTime: updated?.endTime ?? appointment.endTime,
      resourceId: updated?.resourceId ?? appointment.resourceId
    };
  }
}
