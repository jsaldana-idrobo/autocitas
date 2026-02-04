import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { DateTime } from "luxon";
import { Model, isValidObjectId } from "mongoose";
import { Appointment } from "../../schemas/appointment.schema";
import { Block } from "../../schemas/block.schema";
import { Business } from "../../schemas/business.schema";
import {
  DEFAULT_TIMEZONE,
  ERR_APPOINTMENT_CONFLICT,
  ERR_APPOINTMENT_NOT_FOUND,
  ERR_CANCEL_WINDOW,
  ERR_INVALID_DATE_FORMAT,
  ERR_INVALID_STARTTIME,
  ERR_OUTSIDE_HOURS,
  ERR_RESOURCE_NOT_ALLOWED,
  ERR_RESOURCE_REQUIRED,
  STATUS_BOOKED
} from "./admin.constants";
import { AdminBusinessContextService } from "./admin-business-context.service";
import { AdminCatalogService } from "./admin-catalog.service";
import { Service } from "../../schemas/service.schema";

@Injectable()
export class AdminAppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<Appointment>,
    @InjectModel(Block.name) private readonly blockModel: Model<Block>,
    @InjectModel(Business.name) private readonly businessModel: Model<Business>,
    private readonly businessContext: AdminBusinessContextService,
    private readonly catalogService: AdminCatalogService
  ) {}

  async listAppointments(
    businessId: string,
    date?: string,
    resourceId?: string,
    status?: "booked" | "cancelled" | "completed",
    search?: string,
    from?: string,
    to?: string
  ) {
    await this.businessContext.getBusinessContext(businessId);

    const query: Record<string, unknown> = { businessId };
    if (resourceId) {
      query.resourceId = resourceId;
    }
    if (status) {
      query.status = status;
    }
    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new BadRequestException(ERR_INVALID_DATE_FORMAT);
      }
      query.startTime = { $gte: start, $lte: end };
    }
    if (from && to) {
      const start = new Date(from);
      const end = new Date(to);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new BadRequestException(ERR_INVALID_DATE_FORMAT);
      }
      query.startTime = { $lt: end };
      query.endTime = { $gt: start };
    }
    if (search) {
      const trimmed = search.trim();
      if (trimmed.length > 0) {
        query.$or = [
          { customerName: { $regex: trimmed, $options: "i" } },
          { customerPhone: { $regex: trimmed, $options: "i" } }
        ];
      }
    }

    return this.appointmentModel.find(query).lean();
  }

  async updateAppointmentStatus(
    businessId: string,
    appointmentId: string,
    status: "booked" | "cancelled" | "completed",
    resourceId?: string,
    role?: "owner" | "staff" | "platform_admin" | "unknown"
  ) {
    await this.businessContext.getBusinessContext(businessId);

    if (!isValidObjectId(appointmentId)) {
      throw new BadRequestException("Invalid appointmentId.");
    }

    const query: Record<string, unknown> = { _id: appointmentId, businessId };
    if (resourceId) {
      query.resourceId = resourceId;
    }

    if (status === "cancelled" && role && role !== "platform_admin") {
      const business = await this.businessModel.findById(businessId).lean();
      if (!business) {
        throw new NotFoundException("Business not found");
      }
      const appointment = await this.appointmentModel.findOne(query).lean();
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
    }

    const appointment = await this.appointmentModel
      .findOneAndUpdate(query, { status }, { new: true })
      .lean();

    if (!appointment) {
      throw new NotFoundException(ERR_APPOINTMENT_NOT_FOUND);
    }

    return appointment;
  }

  async createAppointment(
    businessId: string,
    payload: {
      serviceId: string;
      resourceId?: string;
      customerName: string;
      customerPhone: string;
      startTime: string;
    }
  ) {
    const business = await this.businessContext.getBusinessContext(businessId);
    const service = await this.catalogService.assertService(businessId, payload.serviceId);
    const resourceId = payload.resourceId
      ? await this.catalogService.assertResource(businessId, payload.resourceId)
      : undefined;
    this.ensureServiceResource(service, resourceId);

    const timezone = business.timezone || DEFAULT_TIMEZONE;
    const startLocal = DateTime.fromISO(payload.startTime, { zone: timezone });
    if (!startLocal.isValid) {
      throw new BadRequestException(ERR_INVALID_STARTTIME);
    }

    this.assertWithinBusinessHours(business, startLocal, service.durationMinutes);
    await this.ensureNoConflicts(
      businessId,
      startLocal,
      service.durationMinutes,
      resourceId ?? undefined
    );

    const startUtc = startLocal.toUTC();
    const endUtc = startUtc.plus({ minutes: service.durationMinutes });

    const created = await this.appointmentModel.create({
      businessId,
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

  async updateAppointmentDetails(
    businessId: string,
    appointmentId: string,
    payload: { serviceId?: string; resourceId?: string; startTime?: string },
    actingResourceId?: string
  ) {
    await this.businessContext.getBusinessContext(businessId);
    if (!isValidObjectId(appointmentId)) {
      throw new BadRequestException("Invalid appointmentId.");
    }

    const appointment = await this.appointmentModel.findById(appointmentId).lean();
    if (!appointment) {
      throw new NotFoundException(ERR_APPOINTMENT_NOT_FOUND);
    }
    if (actingResourceId && appointment.resourceId?.toString() !== actingResourceId) {
      throw new ForbiddenException("Staff can only update their own appointments.");
    }

    const serviceId = payload.serviceId ?? appointment.serviceId.toString();
    const service = await this.catalogService.assertService(businessId, serviceId);

    const resourceId = payload.resourceId
      ? await this.catalogService.assertResource(businessId, payload.resourceId)
      : appointment.resourceId?.toString();
    this.ensureServiceResource(service, resourceId);

    const business = await this.businessContext.getBusinessContext(businessId);
    const timezone = business.timezone || DEFAULT_TIMEZONE;
    const startLocal = payload.startTime
      ? DateTime.fromISO(payload.startTime, { zone: timezone })
      : DateTime.fromJSDate(appointment.startTime).setZone(timezone);

    if (!startLocal.isValid) {
      throw new BadRequestException(ERR_INVALID_STARTTIME);
    }

    this.assertWithinBusinessHours(business, startLocal, service.durationMinutes);
    await this.ensureNoConflicts(
      businessId,
      startLocal,
      service.durationMinutes,
      resourceId ?? undefined,
      appointment._id.toString()
    );

    const startUtc = startLocal.toUTC();
    const endUtc = startUtc.plus({ minutes: service.durationMinutes });

    const updated = await this.appointmentModel
      .findOneAndUpdate(
        { _id: appointmentId, businessId },
        {
          serviceId,
          resourceId,
          startTime: startUtc.toJSDate(),
          endTime: endUtc.toJSDate()
        },
        { new: true }
      )
      .lean();

    return updated ?? appointment;
  }

  private async ensureNoConflicts(
    businessId: string,
    startLocal: DateTime,
    durationMinutes: number,
    resourceId?: string,
    ignoreAppointmentId?: string
  ) {
    const startUtc = startLocal.toUTC().toJSDate();
    const endUtc = startLocal.toUTC().plus({ minutes: durationMinutes }).toJSDate();

    const appointmentQuery: Record<string, unknown> = {
      businessId,
      status: STATUS_BOOKED,
      startTime: { $lt: endUtc },
      endTime: { $gt: startUtc }
    };
    if (resourceId) {
      appointmentQuery.resourceId = resourceId;
    }
    if (ignoreAppointmentId) {
      appointmentQuery._id = { $ne: ignoreAppointmentId };
    }

    const blockQuery: Record<string, unknown> = {
      businessId,
      startTime: { $lt: endUtc },
      endTime: { $gt: startUtc }
    };
    if (resourceId) {
      blockQuery.$or = [{ resourceId }, { resourceId: { $exists: false } }];
    }

    const [appointments, blocks] = await Promise.all([
      this.appointmentModel.countDocuments(appointmentQuery),
      this.blockModel.countDocuments(blockQuery)
    ]);

    if (appointments > 0 || blocks > 0) {
      throw new BadRequestException(ERR_APPOINTMENT_CONFLICT);
    }
  }

  private assertWithinBusinessHours(
    business: Business,
    startLocal: DateTime,
    durationMinutes: number
  ) {
    const dayIndex = startLocal.weekday % 7;
    const dayHours = business.hours?.find((hour) => hour.dayOfWeek === dayIndex);
    if (!dayHours) {
      throw new BadRequestException(ERR_OUTSIDE_HOURS);
    }
    const [openHour, openMinute] = dayHours.openTime.split(":").map(Number);
    const [closeHour, closeMinute] = dayHours.closeTime.split(":").map(Number);
    const openLocal = startLocal.set({
      hour: openHour,
      minute: openMinute,
      second: 0,
      millisecond: 0
    });
    const closeLocal = startLocal.set({
      hour: closeHour,
      minute: closeMinute,
      second: 0,
      millisecond: 0
    });
    const endLocal = startLocal.plus({ minutes: durationMinutes });
    if (startLocal < openLocal || endLocal > closeLocal) {
      throw new BadRequestException(ERR_OUTSIDE_HOURS);
    }
  }

  private ensureServiceResource(service: Service, resourceId?: string) {
    const allowedResourceIds = (service.allowedResourceIds || []).map((id) => id.toString());
    if (allowedResourceIds.length === 0) {
      return;
    }
    if (!resourceId) {
      throw new BadRequestException(ERR_RESOURCE_REQUIRED);
    }
    if (!allowedResourceIds.includes(resourceId)) {
      throw new BadRequestException(ERR_RESOURCE_NOT_ALLOWED);
    }
  }
}
