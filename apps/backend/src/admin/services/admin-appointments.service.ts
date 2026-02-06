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
  ERR_APPOINTMENT_NOT_FOUND,
  ERR_CANCEL_WINDOW,
  ERR_INVALID_DATE_FORMAT,
  ERR_INVALID_STARTTIME
} from "./admin.constants";
import { AdminBusinessContextService } from "./admin-business-context.service";
import { AdminCatalogService } from "./admin-catalog.service";
import {
  assertWithinBusinessHours,
  buildAppointmentSearchQuery,
  ensureNoConflicts,
  ensureServiceResource,
  TEXT_SCORE
} from "./admin-appointments.helpers";

type AppointmentStatus = "booked" | "cancelled" | "completed";

@Injectable()
export class AdminAppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<Appointment>,
    @InjectModel(Block.name) private readonly blockModel: Model<Block>,
    @InjectModel(Business.name) private readonly businessModel: Model<Business>,
    private readonly businessContext: AdminBusinessContextService,
    private readonly catalogService: AdminCatalogService
  ) {}

  // eslint-disable-next-line sonarjs/cognitive-complexity
  async listAppointments(
    businessId: string,
    options?: {
      date?: string;
      resourceId?: string;
      status?: AppointmentStatus;
      search?: string;
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    }
  ) {
    await this.businessContext.getBusinessContext(businessId);

    const query: Record<string, unknown> = { businessId };
    if (options?.resourceId) {
      query.resourceId = options.resourceId;
    }
    if (options?.status) {
      query.status = options.status;
    }
    if (options?.date) {
      const start = new Date(`${options.date}T00:00:00.000Z`);
      const end = new Date(`${options.date}T23:59:59.999Z`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new BadRequestException(ERR_INVALID_DATE_FORMAT);
      }
      query.startTime = { $gte: start, $lte: end };
    }
    if (options?.from && options?.to) {
      const start = new Date(options.from);
      const end = new Date(options.to);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new BadRequestException(ERR_INVALID_DATE_FORMAT);
      }
      query.startTime = { $lt: end };
      query.endTime = { $gt: start };
    }
    const searchMeta = buildAppointmentSearchQuery(options?.search);
    Object.assign(query, searchMeta.query);

    if (options?.page && options?.limit) {
      const total = await this.appointmentModel.countDocuments(query);
      const baseQuery = this.appointmentModel.find(query);
      if (searchMeta.useTextScore) {
        baseQuery.select({ score: { $meta: TEXT_SCORE } });
        baseQuery.sort({ score: { $meta: TEXT_SCORE }, startTime: 1 });
      } else {
        baseQuery.sort({ startTime: 1 });
      }
      const items = await baseQuery
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean();
      return { items, total, page: options.page, limit: options.limit };
    }

    const baseQuery = this.appointmentModel.find(query);
    if (searchMeta.useTextScore) {
      baseQuery.select({ score: { $meta: TEXT_SCORE } });
      baseQuery.sort({ score: { $meta: TEXT_SCORE }, startTime: 1 });
    } else {
      baseQuery.sort({ startTime: 1 });
    }
    return baseQuery.lean();
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
    ensureServiceResource(service, resourceId);

    const timezone = business.timezone || DEFAULT_TIMEZONE;
    const startLocal = DateTime.fromISO(payload.startTime, { zone: timezone });
    if (!startLocal.isValid) {
      throw new BadRequestException(ERR_INVALID_STARTTIME);
    }

    assertWithinBusinessHours(business, startLocal, service.durationMinutes);
    await ensureNoConflicts({
      appointmentModel: this.appointmentModel,
      blockModel: this.blockModel,
      businessId,
      startLocal,
      durationMinutes: service.durationMinutes,
      resourceId: resourceId ?? undefined
    });

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
      status: "booked"
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
    ensureServiceResource(service, resourceId);

    const business = await this.businessContext.getBusinessContext(businessId);
    const timezone = business.timezone || DEFAULT_TIMEZONE;
    const startLocal = payload.startTime
      ? DateTime.fromISO(payload.startTime, { zone: timezone })
      : DateTime.fromJSDate(appointment.startTime).setZone(timezone);

    if (!startLocal.isValid) {
      throw new BadRequestException(ERR_INVALID_STARTTIME);
    }

    assertWithinBusinessHours(business, startLocal, service.durationMinutes);
    await ensureNoConflicts({
      appointmentModel: this.appointmentModel,
      blockModel: this.blockModel,
      businessId,
      startLocal,
      durationMinutes: service.durationMinutes,
      resourceId: resourceId ?? undefined,
      ignoreAppointmentId: appointment._id.toString()
    });

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
}
