import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import type { Request } from "express";
import { CreateBusinessDto } from "./dto/create-business.dto.js";
import { CreateOwnerDto } from "./dto/create-owner.dto.js";
import { UpdateBusinessDto } from "./dto/update-business.dto.js";
import { UpdatePlatformUserDto } from "./dto/update-platform-user.dto.js";
import type { JwtPayload } from "./auth/jwt.strategy.js";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { AdminAccessService } from "./services/admin-access.service.js";
import { AdminPlatformService } from "./services/admin-platform.service.js";
import { AuditService } from "../audit/audit.service.js";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

type ActiveFilter = "true" | "false";
type BusinessStatus = "active" | "inactive";
type UserRole = "owner" | "staff";
type AppointmentStatus = "booked" | "cancelled" | "completed";
type BlockType = "resource" | "global";

@Controller("admin/platform")
@UseGuards(JwtAuthGuard)
export class PlatformController {
  constructor(
    private readonly access: AdminAccessService,
    private readonly platform: AdminPlatformService,
    private readonly audit: AuditService
  ) {}

  private logPlatformAction(
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

  @Get("businesses")
  listBusinesses(
    @Query()
    query: {
      search?: string;
      status?: BusinessStatus;
      page?: string;
      limit?: string;
    },
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.listBusinesses({
      search: query.search,
      status: query.status,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined
    });
  }

  @Post("businesses")
  createBusiness(@Body() body: CreateBusinessDto, @Req() req: AuthenticatedRequest) {
    this.access.ensurePlatformAdmin(req.user);
    const created = this.platform.createBusiness(body);
    void this.logPlatformAction(req, { action: "create", entity: "business", metadata: { body } });
    return created;
  }

  @Patch("businesses/:businessId")
  updateBusiness(
    @Param("businessId") businessId: string,
    @Body() body: UpdateBusinessDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensurePlatformAdmin(req.user);
    const updated = this.platform.updateBusiness(businessId, body);
    void this.logPlatformAction(req, {
      action: "update",
      entity: "business",
      entityId: businessId,
      businessId,
      metadata: { body }
    });
    return updated;
  }

  @Delete("businesses/:businessId")
  deleteBusiness(@Param("businessId") businessId: string, @Req() req: AuthenticatedRequest) {
    this.access.ensurePlatformAdmin(req.user);
    const deleted = this.platform.deleteBusiness(businessId);
    void this.logPlatformAction(req, {
      action: "delete",
      entity: "business",
      entityId: businessId,
      businessId
    });
    return deleted;
  }

  @Post("owners")
  createOwner(@Body() body: CreateOwnerDto, @Req() req: AuthenticatedRequest) {
    this.access.ensurePlatformAdmin(req.user);
    const created = this.platform.createOwner(body);
    void this.logPlatformAction(req, {
      action: "create",
      entity: "owner",
      businessId: body.businessId,
      metadata: { email: body.email }
    });
    return created;
  }

  @Get("users")
  listUsers(
    @Query()
    query: {
      role: UserRole;
      search?: string;
      active?: ActiveFilter;
      page?: string;
      limit?: string;
    },
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.listPlatformUsers(query.role, {
      search: query.search,
      active: query.active,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined
    });
  }

  @Patch("users/:userId")
  updateUser(
    @Param("userId") userId: string,
    @Body() body: UpdatePlatformUserDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensurePlatformAdmin(req.user);
    const updated = this.platform.updatePlatformUser(userId, body);
    void this.logPlatformAction(req, {
      action: "update",
      entity: "user",
      entityId: userId,
      businessId: body.businessId,
      metadata: { body }
    });
    return updated;
  }

  @Delete("users/:userId")
  deleteUser(@Param("userId") userId: string, @Req() req: AuthenticatedRequest) {
    this.access.ensurePlatformAdmin(req.user);
    const deleted = this.platform.deletePlatformUser(userId);
    void this.logPlatformAction(req, { action: "delete", entity: "user", entityId: userId });
    return deleted;
  }

  @Get("appointments")
  listAppointments(
    @Query()
    query: {
      date?: string;
      status?: AppointmentStatus;
      search?: string;
      page?: string;
      limit?: string;
    },
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.listPlatformAppointmentsWithSearch(
      query.date,
      query.status,
      query.search,
      query.page ? Number(query.page) : undefined,
      query.limit ? Number(query.limit) : undefined
    );
  }

  @Get("services")
  listServices(
    @Query()
    query: {
      businessId?: string;
      active?: ActiveFilter;
      search?: string;
      minDuration?: string;
      maxDuration?: string;
      minPrice?: string;
      maxPrice?: string;
      page?: string;
      limit?: string;
    },
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.listPlatformServices({
      businessId: query.businessId,
      active: query.active,
      search: query.search,
      minDuration: query.minDuration ? Number(query.minDuration) : undefined,
      maxDuration: query.maxDuration ? Number(query.maxDuration) : undefined,
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined
    });
  }

  @Get("resources")
  listResources(
    @Query()
    query: {
      businessId?: string;
      active?: ActiveFilter;
      search?: string;
      page?: string;
      limit?: string;
    },
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.listPlatformResources({
      businessId: query.businessId,
      active: query.active,
      search: query.search,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined
    });
  }

  @Get("blocks")
  listBlocks(
    @Query()
    query: {
      businessId?: string;
      resourceId?: string;
      search?: string;
      type?: BlockType;
      from?: string;
      to?: string;
      page?: string;
      limit?: string;
    },
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.listPlatformBlocks({
      businessId: query.businessId,
      resourceId: query.resourceId,
      search: query.search,
      type: query.type,
      from: query.from,
      to: query.to,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined
    });
  }
}
