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
    private readonly staff: AdminStaffService
  ) {}

  @Get(":businessId/appointments")
  listAppointments(
    @Param("businessId") businessId: string,
    @Query("date") date: string | undefined,
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @Query("status") status: "booked" | "cancelled" | "completed" | undefined,
    @Query("search") search: string | undefined,
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
        to
      );
    }
    return this.appointments.listAppointments(businessId, date, undefined, status, search, from, to);
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
      return this.appointments.createAppointment(businessId, {
        ...body,
        resourceId: req.user.resourceId
      });
    }
    this.access.ensureOwnerAccess(req.user);
    return this.appointments.createAppointment(businessId, body);
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
      return this.appointments.updateAppointmentStatus(
        businessId,
        appointmentId,
        body.status,
        req.user.resourceId,
        req.user.role
      );
    }
    return this.appointments.updateAppointmentStatus(businessId, appointmentId, body.status, undefined, req.user.role);
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
      return this.appointments.updateAppointmentDetails(
        businessId,
        appointmentId,
        { ...body, resourceId: req.user.resourceId },
        req.user.resourceId
      );
    }
    this.access.ensureOwnerAccess(req.user);
    return this.appointments.updateAppointmentDetails(businessId, appointmentId, body);
  }

  @Get(":businessId")
  getBusiness(@Param("businessId") businessId: string, @Req() req: AuthenticatedRequest) {
    this.access.ensureBusinessAccess(req.user, businessId);
    return this.business.getBusiness(businessId);
  }

  @Get(":businessId/services")
  listServices(@Param("businessId") businessId: string, @Req() req: AuthenticatedRequest) {
    this.access.ensureBusinessAccess(req.user, businessId);
    if (req.user.role !== "staff") {
      this.access.ensureOwnerAccess(req.user);
    }
    return this.catalog.listServices(businessId);
  }

  @Post(":businessId/services")
  createService(
    @Param("businessId") businessId: string,
    @Body() body: CreateServiceDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    return this.catalog.createService(businessId, body);
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
    return this.catalog.updateService(businessId, serviceId, body);
  }

  @Get(":businessId/resources")
  listResources(@Param("businessId") businessId: string, @Req() req: AuthenticatedRequest) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    return this.catalog.listResources(businessId);
  }

  @Post(":businessId/resources")
  createResource(
    @Param("businessId") businessId: string,
    @Body() body: CreateResourceDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    return this.catalog.createResource(businessId, body);
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
    return this.catalog.updateResource(businessId, resourceId, body);
  }

  @Delete(":businessId/resources/:resourceId")
  deleteResource(
    @Param("businessId") businessId: string,
    @Param("resourceId") resourceId: string,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    return this.catalog.deleteResource(businessId, resourceId);
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
      return this.blocks.createBlock(businessId, {
        ...body,
        resourceId: req.user.resourceId
      });
    }
    return this.blocks.createBlock(businessId, body);
  }

  @Get(":businessId/blocks")
  listBlocks(
    @Param("businessId") businessId: string,
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    if (req.user.role === "staff") {
      if (!req.user.resourceId) {
        throw new ForbiddenException(ERR_STAFF_RESOURCE_NOT_LINKED);
      }
      return this.blocks.listBlocks(businessId, req.user.resourceId, from, to);
    }
    return this.blocks.listBlocks(businessId, undefined, from, to);
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
      return this.blocks.updateBlock(businessId, blockId, rest, req.user.resourceId);
    }
    this.access.ensureOwnerAccess(req.user);
    return this.blocks.updateBlock(businessId, blockId, body);
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
      return this.blocks.deleteBlock(businessId, blockId, req.user.resourceId);
    }
    this.access.ensureOwnerAccess(req.user);
    return this.blocks.deleteBlock(businessId, blockId);
  }

  @Patch(":businessId")
  updateBusiness(
    @Param("businessId") businessId: string,
    @Body() body: UpdateBusinessDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    return this.business.updateBusiness(businessId, body);
  }

  @Patch(":businessId/policies")
  updatePolicies(
    @Param("businessId") businessId: string,
    @Body() body: UpdatePoliciesDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    return this.business.updatePolicies(businessId, body);
  }

  @Patch(":businessId/hours")
  updateHours(
    @Param("businessId") businessId: string,
    @Body() body: UpdateHoursDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    return this.business.updateHours(businessId, body);
  }

  @Get(":businessId/staff")
  listStaff(@Param("businessId") businessId: string, @Req() req: AuthenticatedRequest) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    return this.staff.listStaff(businessId);
  }

  @Post(":businessId/staff")
  createStaff(
    @Param("businessId") businessId: string,
    @Body() body: CreateStaffDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    return this.staff.createStaff(businessId, body);
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
    return this.staff.updateStaff(businessId, staffId, body);
  }
}
