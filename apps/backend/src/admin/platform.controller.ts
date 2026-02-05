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
import { Request } from "express";
import { CreateBusinessDto } from "./dto/create-business.dto";
import { CreateOwnerDto } from "./dto/create-owner.dto";
import { UpdateBusinessDto } from "./dto/update-business.dto";
import { UpdatePlatformUserDto } from "./dto/update-platform-user.dto";
import { JwtPayload } from "./auth/jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AdminAccessService } from "./services/admin-access.service";
import { AdminPlatformService } from "./services/admin-platform.service";
import { AuditService } from "../audit/audit.service";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

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
    @Query("search") search: string | undefined,
    @Query("status") status: "active" | "inactive" | undefined,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.listBusinesses({
      search,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
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
    @Query("role") role: "owner" | "staff",
    @Query("search") search: string | undefined,
    @Query("active") active: "true" | "false" | undefined,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.listPlatformUsers(role, {
      search,
      active,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
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
    @Query("date") date: string | undefined,
    @Query("status") status: "booked" | "cancelled" | "completed" | undefined,
    @Query("search") search: string | undefined,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.listPlatformAppointmentsWithSearch(
      date,
      status,
      search,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined
    );
  }

  @Get("services")
  listServices(
    @Query("businessId") businessId: string | undefined,
    @Query("active") active: "true" | "false" | undefined,
    @Query("search") search: string | undefined,
    @Query("minDuration") minDuration: string | undefined,
    @Query("maxDuration") maxDuration: string | undefined,
    @Query("minPrice") minPrice: string | undefined,
    @Query("maxPrice") maxPrice: string | undefined,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.listPlatformServices({
      businessId,
      active,
      search,
      minDuration: minDuration ? Number(minDuration) : undefined,
      maxDuration: maxDuration ? Number(maxDuration) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    });
  }

  @Get("resources")
  listResources(
    @Query("businessId") businessId: string | undefined,
    @Query("active") active: "true" | "false" | undefined,
    @Query("search") search: string | undefined,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.listPlatformResources({
      businessId,
      active,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    });
  }

  @Get("blocks")
  listBlocks(
    @Query("businessId") businessId: string | undefined,
    @Query("resourceId") resourceId: string | undefined,
    @Query("search") search: string | undefined,
    @Query("type") type: "resource" | "global" | undefined,
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.listPlatformBlocks({
      businessId,
      resourceId,
      search,
      type,
      from,
      to,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    });
  }
}
