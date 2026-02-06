import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { CreateAdminAppointmentDto } from "../dto/create-appointment.dto.js";
import { UpdateAppointmentDto } from "../dto/update-appointment.dto.js";
import { UpdateAdminAppointmentDto } from "../dto/update-admin-appointment.dto.js";
import { JwtAuthGuard } from "../guards/jwt-auth.guard.js";
import { AdminAccessService } from "../services/admin-access.service.js";
import { AdminAppointmentsService } from "../services/admin-appointments.service.js";
import { AuditService } from "../../audit/audit.service.js";
import type { AppointmentStatus, AuthenticatedRequest } from "./admin-controller.helpers.js";
import { ERR_STAFF_RESOURCE_NOT_LINKED, logAdminAction } from "./admin-controller.helpers.js";

@Controller("admin/businesses")
@UseGuards(JwtAuthGuard)
export class AdminAppointmentsController {
  constructor(
    private readonly access: AdminAccessService,
    private readonly appointments: AdminAppointmentsService,
    private readonly audit: AuditService
  ) {}

  @Get(":businessId/appointments")
  listAppointments(
    @Param("businessId") businessId: string,
    @Query()
    query: {
      date?: string;
      from?: string;
      to?: string;
      status?: AppointmentStatus;
      search?: string;
      page?: string;
      limit?: string;
    },
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    const options = {
      date: query.date,
      from: query.from,
      to: query.to,
      status: query.status,
      search: query.search,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined
    };
    if (req.user.role === "staff") {
      if (!req.user.resourceId) {
        throw new ForbiddenException(ERR_STAFF_RESOURCE_NOT_LINKED);
      }
      return this.appointments.listAppointments(businessId, {
        ...options,
        resourceId: req.user.resourceId
      });
    }
    return this.appointments.listAppointments(businessId, options);
  }

  @Post(":businessId/appointments")
  createAppointment(
    @Param("businessId") businessId: string,
    @Body() body: CreateAdminAppointmentDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    if (req.user.role === "staff") {
      if (!req.user.resourceId) {
        throw new ForbiddenException(ERR_STAFF_RESOURCE_NOT_LINKED);
      }
      const created = this.appointments.createAppointment(businessId, {
        ...body,
        resourceId: req.user.resourceId
      });
      void logAdminAction(this.audit, req, {
        action: "create",
        entity: "appointment",
        businessId,
        metadata: { payload: body }
      });
      return created;
    }
    this.access.ensureOwnerAccess(req.user);
    const created = this.appointments.createAppointment(businessId, body);
    void logAdminAction(this.audit, req, {
      action: "create",
      entity: "appointment",
      businessId,
      metadata: { payload: body }
    });
    return created;
  }

  @Patch(":businessId/appointments/:appointmentId")
  updateAppointmentStatus(
    @Param("businessId") businessId: string,
    @Param("appointmentId") appointmentId: string,
    @Body() body: UpdateAppointmentDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    if (req.user.role === "staff") {
      if (!req.user.resourceId) {
        throw new ForbiddenException(ERR_STAFF_RESOURCE_NOT_LINKED);
      }
      const updated = this.appointments.updateAppointmentStatus(
        businessId,
        appointmentId,
        body.status,
        req.user.resourceId,
        req.user.role
      );
      void logAdminAction(this.audit, req, {
        action: "status",
        entity: "appointment",
        entityId: appointmentId,
        businessId,
        metadata: { status: body.status }
      });
      return updated;
    }
    const updated = this.appointments.updateAppointmentStatus(
      businessId,
      appointmentId,
      body.status,
      undefined,
      req.user.role
    );
    void logAdminAction(this.audit, req, {
      action: "status",
      entity: "appointment",
      entityId: appointmentId,
      businessId,
      metadata: { status: body.status }
    });
    return updated;
  }

  @Patch(":businessId/appointments/:appointmentId/details")
  updateAppointmentDetails(
    @Param("businessId") businessId: string,
    @Param("appointmentId") appointmentId: string,
    @Body() body: UpdateAdminAppointmentDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    if (req.user.role === "staff") {
      if (!req.user.resourceId) {
        throw new ForbiddenException(ERR_STAFF_RESOURCE_NOT_LINKED);
      }
      const updated = this.appointments.updateAppointmentDetails(
        businessId,
        appointmentId,
        { ...body, resourceId: req.user.resourceId },
        req.user.resourceId
      );
      void logAdminAction(this.audit, req, {
        action: "update",
        entity: "appointment",
        entityId: appointmentId,
        businessId,
        metadata: { payload: body }
      });
      return updated;
    }
    const updated = this.appointments.updateAppointmentDetails(businessId, appointmentId, body);
    void logAdminAction(this.audit, req, {
      action: "update",
      entity: "appointment",
      entityId: appointmentId,
      businessId,
      metadata: { payload: body }
    });
    return updated;
  }
}
