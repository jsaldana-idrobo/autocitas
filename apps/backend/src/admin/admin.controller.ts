import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { Request } from "express";
import { JwtPayload } from "./auth/jwt.strategy";
import { CreateBlockDto } from "./dto/create-block.dto";
import { CreateAdminAppointmentDto } from "./dto/create-appointment.dto";
import { CreateResourceDto } from "./dto/create-resource.dto";
import { CreateServiceDto } from "./dto/create-service.dto";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
import { UpdateBlockDto } from "./dto/update-block.dto";
import { UpdateBusinessDto } from "./dto/update-business.dto";
import { UpdateHoursDto } from "./dto/update-hours.dto";
import { UpdatePoliciesDto } from "./dto/update-policies.dto";
import { UpdateResourceDto } from "./dto/update-resource.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { UpdateStaffDto } from "./dto/update-staff.dto";
import { UpdateAdminAppointmentDto } from "./dto/update-admin-appointment.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AdminAccessService } from "./services/admin-access.service";
import { AdminAppointmentsService } from "./services/admin-appointments.service";
import { AdminBlocksService } from "./services/admin-blocks.service";
import { AdminBusinessService } from "./services/admin-business.service";
import { AdminCatalogService } from "./services/admin-catalog.service";
import { AdminStaffService } from "./services/admin-staff.service";
import { AuditService } from "../audit/audit.service";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

const ERR_STAFF_RESOURCE_NOT_LINKED = "Staff resource not linked";

@Controller("admin/businesses")
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(
    private readonly access: AdminAccessService,
    private readonly appointments: AdminAppointmentsService,
    private readonly blocks: AdminBlocksService,
    private readonly business: AdminBusinessService,
    private readonly catalog: AdminCatalogService,
    private readonly staff: AdminStaffService,
    private readonly audit: AuditService
  ) {}

  private logAdminAction(
    req: AuthenticatedRequest,
    payload: {
      action: string;
      entity: string;
      entityId?: string;
      businessId?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    return this.audit.log({
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId,
      businessId: payload.businessId,
      actorType: "admin",
      actorId: req.user.sub,
      actorRole: req.user.role,
      metadata: payload.metadata
    });
  }

  @Get(":businessId/appointments")
  listAppointments(
    @Param("businessId") businessId: string,
    @Query("date") date: string | undefined,
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @Query("status") status: "booked" | "cancelled" | "completed" | undefined,
    @Query("search") search: string | undefined,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    if (req.user.role === "staff") {
      if (!req.user.resourceId) {
        throw new ForbiddenException(ERR_STAFF_RESOURCE_NOT_LINKED);
      }
      return this.appointments.listAppointments(
        businessId,
        date,
        req.user.resourceId,
        status,
        search,
        from,
        to,
        page ? Number(page) : undefined,
        limit ? Number(limit) : undefined
      );
    }
    return this.appointments.listAppointments(
      businessId,
      date,
      undefined,
      status,
      search,
      from,
      to,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined
    );
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
      void this.logAdminAction(req, {
        action: "create",
        entity: "appointment",
        businessId,
        metadata: { payload: body }
      });
      return created;
    }
    this.access.ensureOwnerAccess(req.user);
    const created = this.appointments.createAppointment(businessId, body);
    void this.logAdminAction(req, {
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
      void this.logAdminAction(req, {
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
    void this.logAdminAction(req, {
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
      void this.logAdminAction(req, {
        action: "update",
        entity: "appointment",
        entityId: appointmentId,
        businessId,
        metadata: { payload: body }
      });
      return updated;
    }
    this.access.ensureOwnerAccess(req.user);
    const updated = this.appointments.updateAppointmentDetails(businessId, appointmentId, body);
    void this.logAdminAction(req, {
      action: "update",
      entity: "appointment",
      entityId: appointmentId,
      businessId,
      metadata: { payload: body }
    });
    return updated;
  }

  @Get(":businessId")
  getBusiness(@Param("businessId") businessId: string, @Req() req: AuthenticatedRequest) {
    this.access.ensureBusinessAccess(req.user, businessId);
    return this.business.getBusiness(businessId);
  }

  @Get(":businessId/policies")
  getPolicies(@Param("businessId") businessId: string, @Req() req: AuthenticatedRequest) {
    this.access.ensureBusinessAccess(req.user, businessId);
    return this.business.getPolicies(businessId);
  }

  @Get(":businessId/hours")
  getHours(@Param("businessId") businessId: string, @Req() req: AuthenticatedRequest) {
    this.access.ensureBusinessAccess(req.user, businessId);
    return this.business.getHours(businessId);
  }

  @Get(":businessId/services")
  listServices(
    @Param("businessId") businessId: string,
    @Query("search") search: string | undefined,
    @Query("active") active: "true" | "false" | undefined,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    if (req.user.role !== "staff") {
      this.access.ensureOwnerAccess(req.user);
    }
    return this.catalog.listServices(businessId, {
      search,
      active,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    });
  }

  @Post(":businessId/services")
  createService(
    @Param("businessId") businessId: string,
    @Body() body: CreateServiceDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    const created = this.catalog.createService(businessId, body);
    void this.logAdminAction(req, {
      action: "create",
      entity: "service",
      businessId,
      metadata: { payload: body }
    });
    return created;
  }

  @Patch(":businessId/services/:serviceId")
  updateService(
    @Param("businessId") businessId: string,
    @Param("serviceId") serviceId: string,
    @Body() body: UpdateServiceDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    const updated = this.catalog.updateService(businessId, serviceId, body);
    void this.logAdminAction(req, {
      action: "update",
      entity: "service",
      entityId: serviceId,
      businessId,
      metadata: { payload: body }
    });
    return updated;
  }

  @Delete(":businessId/services/:serviceId")
  deleteService(
    @Param("businessId") businessId: string,
    @Param("serviceId") serviceId: string,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    const deleted = this.catalog.deleteService(businessId, serviceId);
    void this.logAdminAction(req, {
      action: "delete",
      entity: "service",
      entityId: serviceId,
      businessId
    });
    return deleted;
  }

  @Get(":businessId/resources")
  listResources(
    @Param("businessId") businessId: string,
    @Query("search") search: string | undefined,
    @Query("active") active: "true" | "false" | undefined,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    return this.catalog.listResources(businessId, {
      search,
      active,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    });
  }

  @Post(":businessId/resources")
  createResource(
    @Param("businessId") businessId: string,
    @Body() body: CreateResourceDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    const created = this.catalog.createResource(businessId, body);
    void this.logAdminAction(req, {
      action: "create",
      entity: "resource",
      businessId,
      metadata: { payload: body }
    });
    return created;
  }

  @Patch(":businessId/resources/:resourceId")
  updateResource(
    @Param("businessId") businessId: string,
    @Param("resourceId") resourceId: string,
    @Body() body: UpdateResourceDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    const updated = this.catalog.updateResource(businessId, resourceId, body);
    void this.logAdminAction(req, {
      action: "update",
      entity: "resource",
      entityId: resourceId,
      businessId,
      metadata: { payload: body }
    });
    return updated;
  }

  @Delete(":businessId/resources/:resourceId")
  deleteResource(
    @Param("businessId") businessId: string,
    @Param("resourceId") resourceId: string,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    const deleted = this.catalog.deleteResource(businessId, resourceId);
    void this.logAdminAction(req, {
      action: "delete",
      entity: "resource",
      entityId: resourceId,
      businessId
    });
    return deleted;
  }

  @Post(":businessId/blocks")
  createBlock(
    @Param("businessId") businessId: string,
    @Body() body: CreateBlockDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    if (req.user.role === "staff") {
      if (!req.user.resourceId) {
        throw new ForbiddenException(ERR_STAFF_RESOURCE_NOT_LINKED);
      }
      const created = this.blocks.createBlock(businessId, {
        ...body,
        resourceId: req.user.resourceId
      });
      void this.logAdminAction(req, {
        action: "create",
        entity: "block",
        businessId,
        metadata: { payload: body }
      });
      return created;
    }
    const created = this.blocks.createBlock(businessId, body);
    void this.logAdminAction(req, {
      action: "create",
      entity: "block",
      businessId,
      metadata: { payload: body }
    });
    return created;
  }

  @Get(":businessId/blocks")
  listBlocks(
    @Param("businessId") businessId: string,
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @Query("search") search: string | undefined,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    if (req.user.role === "staff") {
      if (!req.user.resourceId) {
        throw new ForbiddenException(ERR_STAFF_RESOURCE_NOT_LINKED);
      }
      return this.blocks.listBlocks(
        businessId,
        req.user.resourceId,
        from,
        to,
        search,
        page ? Number(page) : undefined,
        limit ? Number(limit) : undefined
      );
    }
    return this.blocks.listBlocks(
      businessId,
      undefined,
      from,
      to,
      search,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined
    );
  }

  @Patch(":businessId/blocks/:blockId")
  updateBlock(
    @Param("businessId") businessId: string,
    @Param("blockId") blockId: string,
    @Body() body: UpdateBlockDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    if (req.user.role === "staff") {
      if (!req.user.resourceId) {
        throw new ForbiddenException(ERR_STAFF_RESOURCE_NOT_LINKED);
      }
      const rest = { ...body };
      delete rest.resourceId;
      const updated = this.blocks.updateBlock(businessId, blockId, rest, req.user.resourceId);
      void this.logAdminAction(req, {
        action: "update",
        entity: "block",
        entityId: blockId,
        businessId,
        metadata: { payload: rest }
      });
      return updated;
    }
    this.access.ensureOwnerAccess(req.user);
    const updated = this.blocks.updateBlock(businessId, blockId, body);
    void this.logAdminAction(req, {
      action: "update",
      entity: "block",
      entityId: blockId,
      businessId,
      metadata: { payload: body }
    });
    return updated;
  }

  @Delete(":businessId/blocks/:blockId")
  deleteBlock(
    @Param("businessId") businessId: string,
    @Param("blockId") blockId: string,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    if (req.user.role === "staff") {
      if (!req.user.resourceId) {
        throw new ForbiddenException(ERR_STAFF_RESOURCE_NOT_LINKED);
      }
      const deleted = this.blocks.deleteBlock(businessId, blockId, req.user.resourceId);
      void this.logAdminAction(req, {
        action: "delete",
        entity: "block",
        entityId: blockId,
        businessId
      });
      return deleted;
    }
    this.access.ensureOwnerAccess(req.user);
    const deleted = this.blocks.deleteBlock(businessId, blockId);
    void this.logAdminAction(req, {
      action: "delete",
      entity: "block",
      entityId: blockId,
      businessId
    });
    return deleted;
  }

  @Patch(":businessId")
  updateBusiness(
    @Param("businessId") businessId: string,
    @Body() body: UpdateBusinessDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    const updated = this.business.updateBusiness(businessId, body);
    void this.logAdminAction(req, {
      action: "update",
      entity: "business",
      entityId: businessId,
      businessId,
      metadata: { payload: body }
    });
    return updated;
  }

  @Patch(":businessId/policies")
  updatePolicies(
    @Param("businessId") businessId: string,
    @Body() body: UpdatePoliciesDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    const updated = this.business.updatePolicies(businessId, body);
    void this.logAdminAction(req, {
      action: "update",
      entity: "policies",
      businessId,
      metadata: { payload: body }
    });
    return updated;
  }

  @Patch(":businessId/hours")
  updateHours(
    @Param("businessId") businessId: string,
    @Body() body: UpdateHoursDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    const updated = this.business.updateHours(businessId, body);
    void this.logAdminAction(req, {
      action: "update",
      entity: "hours",
      businessId,
      metadata: { payload: body }
    });
    return updated;
  }

  @Get(":businessId/staff")
  listStaff(
    @Param("businessId") businessId: string,
    @Query("search") search: string | undefined,
    @Query("active") active: "true" | "false" | undefined,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    return this.staff.listStaff(businessId, {
      search,
      active,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    });
  }

  @Post(":businessId/staff")
  createStaff(
    @Param("businessId") businessId: string,
    @Body() body: CreateStaffDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    const created = this.staff.createStaff(businessId, body);
    void this.logAdminAction(req, {
      action: "create",
      entity: "staff",
      businessId,
      metadata: { payload: body }
    });
    return created;
  }

  @Patch(":businessId/staff/:staffId")
  updateStaff(
    @Param("businessId") businessId: string,
    @Param("staffId") staffId: string,
    @Body() body: UpdateStaffDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    const updated = this.staff.updateStaff(businessId, staffId, body);
    void this.logAdminAction(req, {
      action: "update",
      entity: "staff",
      entityId: staffId,
      businessId,
      metadata: { payload: body }
    });
    return updated;
  }

  @Delete(":businessId/staff/:staffId")
  deleteStaff(
    @Param("businessId") businessId: string,
    @Param("staffId") staffId: string,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    const deleted = this.staff.deleteStaff(businessId, staffId);
    void this.logAdminAction(req, {
      action: "delete",
      entity: "staff",
      entityId: staffId,
      businessId
    });
    return deleted;
  }
}
