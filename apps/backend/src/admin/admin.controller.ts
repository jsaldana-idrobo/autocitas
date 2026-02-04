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
import { AdminService } from "./admin.service";
import { CreateBlockDto } from "./dto/create-block.dto";
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
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

const ERR_STAFF_RESOURCE_NOT_LINKED = "Staff resource not linked";

@Controller("admin/businesses")
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get(":businessId/appointments")
  listAppointments(
    @Param("businessId") businessId: string,
    @Query("date") date: string | undefined,
    @Query("status") status: "booked" | "cancelled" | "completed" | undefined,
    @Req() req: AuthenticatedRequest
  ) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    if (req.user.role === "staff") {
      if (!req.user.resourceId) {
        throw new ForbiddenException(ERR_STAFF_RESOURCE_NOT_LINKED);
      }
      return this.adminService.listAppointments(businessId, date, req.user.resourceId, status);
    }
    return this.adminService.listAppointments(businessId, date, undefined, status);
  }

  @Patch(":businessId/appointments/:appointmentId")
  updateAppointmentStatus(
    @Param("businessId") businessId: string,
    @Param("appointmentId") appointmentId: string,
    @Body() body: UpdateAppointmentDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    if (req.user.role === "staff") {
      if (!req.user.resourceId) {
        throw new ForbiddenException(ERR_STAFF_RESOURCE_NOT_LINKED);
      }
      return this.adminService.updateAppointmentStatus(
        businessId,
        appointmentId,
        body.status,
        req.user.resourceId
      );
    }
    return this.adminService.updateAppointmentStatus(businessId, appointmentId, body.status);
  }

  @Get(":businessId")
  getBusiness(@Param("businessId") businessId: string, @Req() req: AuthenticatedRequest) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    return this.adminService.getBusiness(businessId);
  }

  @Get(":businessId/services")
  listServices(@Param("businessId") businessId: string, @Req() req: AuthenticatedRequest) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    this.adminService.ensureOwnerAccess(req.user);
    return this.adminService.listServices(businessId);
  }

  @Post(":businessId/services")
  createService(
    @Param("businessId") businessId: string,
    @Body() body: CreateServiceDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    this.adminService.ensureOwnerAccess(req.user);
    return this.adminService.createService(businessId, body);
  }

  @Patch(":businessId/services/:serviceId")
  updateService(
    @Param("businessId") businessId: string,
    @Param("serviceId") serviceId: string,
    @Body() body: UpdateServiceDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    this.adminService.ensureOwnerAccess(req.user);
    return this.adminService.updateService(businessId, serviceId, body);
  }

  @Get(":businessId/resources")
  listResources(@Param("businessId") businessId: string, @Req() req: AuthenticatedRequest) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    this.adminService.ensureOwnerAccess(req.user);
    return this.adminService.listResources(businessId);
  }

  @Post(":businessId/resources")
  createResource(
    @Param("businessId") businessId: string,
    @Body() body: CreateResourceDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    this.adminService.ensureOwnerAccess(req.user);
    return this.adminService.createResource(businessId, body);
  }

  @Patch(":businessId/resources/:resourceId")
  updateResource(
    @Param("businessId") businessId: string,
    @Param("resourceId") resourceId: string,
    @Body() body: UpdateResourceDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    this.adminService.ensureOwnerAccess(req.user);
    return this.adminService.updateResource(businessId, resourceId, body);
  }

  @Delete(":businessId/resources/:resourceId")
  deleteResource(
    @Param("businessId") businessId: string,
    @Param("resourceId") resourceId: string,
    @Req() req: AuthenticatedRequest
  ) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    this.adminService.ensureOwnerAccess(req.user);
    return this.adminService.deleteResource(businessId, resourceId);
  }

  @Post(":businessId/blocks")
  createBlock(
    @Param("businessId") businessId: string,
    @Body() body: CreateBlockDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    if (req.user.role === "staff") {
      if (!req.user.resourceId) {
        throw new ForbiddenException(ERR_STAFF_RESOURCE_NOT_LINKED);
      }
      return this.adminService.createBlock(businessId, {
        ...body,
        resourceId: req.user.resourceId
      });
    }
    return this.adminService.createBlock(businessId, body);
  }

  @Get(":businessId/blocks")
  listBlocks(@Param("businessId") businessId: string, @Req() req: AuthenticatedRequest) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    if (req.user.role === "staff") {
      if (!req.user.resourceId) {
        throw new ForbiddenException(ERR_STAFF_RESOURCE_NOT_LINKED);
      }
      return this.adminService.listBlocks(businessId, req.user.resourceId);
    }
    return this.adminService.listBlocks(businessId);
  }

  @Patch(":businessId/blocks/:blockId")
  updateBlock(
    @Param("businessId") businessId: string,
    @Param("blockId") blockId: string,
    @Body() body: UpdateBlockDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    if (req.user.role === "staff") {
      if (!req.user.resourceId) {
        throw new ForbiddenException(ERR_STAFF_RESOURCE_NOT_LINKED);
      }
      const rest = { ...body };
      delete rest.resourceId;
      return this.adminService.updateBlock(businessId, blockId, rest, req.user.resourceId);
    }
    this.adminService.ensureOwnerAccess(req.user);
    return this.adminService.updateBlock(businessId, blockId, body);
  }

  @Delete(":businessId/blocks/:blockId")
  deleteBlock(
    @Param("businessId") businessId: string,
    @Param("blockId") blockId: string,
    @Req() req: AuthenticatedRequest
  ) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    if (req.user.role === "staff") {
      if (!req.user.resourceId) {
        throw new ForbiddenException(ERR_STAFF_RESOURCE_NOT_LINKED);
      }
      return this.adminService.deleteBlock(businessId, blockId, req.user.resourceId);
    }
    this.adminService.ensureOwnerAccess(req.user);
    return this.adminService.deleteBlock(businessId, blockId);
  }

  @Patch(":businessId")
  updateBusiness(
    @Param("businessId") businessId: string,
    @Body() body: UpdateBusinessDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    this.adminService.ensureOwnerAccess(req.user);
    return this.adminService.updateBusiness(businessId, body);
  }

  @Patch(":businessId/policies")
  updatePolicies(
    @Param("businessId") businessId: string,
    @Body() body: UpdatePoliciesDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    this.adminService.ensureOwnerAccess(req.user);
    return this.adminService.updatePolicies(businessId, body);
  }

  @Patch(":businessId/hours")
  updateHours(
    @Param("businessId") businessId: string,
    @Body() body: UpdateHoursDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    this.adminService.ensureOwnerAccess(req.user);
    return this.adminService.updateHours(businessId, body);
  }

  @Get(":businessId/staff")
  listStaff(@Param("businessId") businessId: string, @Req() req: AuthenticatedRequest) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    this.adminService.ensureOwnerAccess(req.user);
    return this.adminService.listStaff(businessId);
  }

  @Post(":businessId/staff")
  createStaff(
    @Param("businessId") businessId: string,
    @Body() body: CreateStaffDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    this.adminService.ensureOwnerAccess(req.user);
    return this.adminService.createStaff(businessId, body);
  }

  @Patch(":businessId/staff/:staffId")
  updateStaff(
    @Param("businessId") businessId: string,
    @Param("staffId") staffId: string,
    @Body() body: UpdateStaffDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.adminService.ensureBusinessAccess(req.user, businessId);
    this.adminService.ensureOwnerAccess(req.user);
    return this.adminService.updateStaff(businessId, staffId, body);
  }
}
