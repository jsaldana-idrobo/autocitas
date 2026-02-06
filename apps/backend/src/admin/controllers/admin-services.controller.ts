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
import { CreateServiceDto } from "../dto/create-service.dto.js";
import { UpdateServiceDto } from "../dto/update-service.dto.js";
import { JwtAuthGuard } from "../guards/jwt-auth.guard.js";
import { AdminAccessService } from "../services/admin-access.service.js";
import { AdminCatalogService } from "../services/admin-catalog.service.js";
import { AuditService } from "../../audit/audit.service.js";
import type { ActiveFilter, AuthenticatedRequest } from "./admin-controller.helpers.js";
import { logAdminAction } from "./admin-controller.helpers.js";

@Controller("admin/businesses")
@UseGuards(JwtAuthGuard)
export class AdminServicesController {
  constructor(
    private readonly access: AdminAccessService,
    private readonly catalog: AdminCatalogService,
    private readonly audit: AuditService
  ) {}

  @Get(":businessId/services")
  listServices(
    @Param("businessId") businessId: string,
    @Query()
    query: {
      search?: string;
      active?: ActiveFilter;
      page?: string;
      limit?: string;
    },
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    if (req.user.role !== "staff") {
      this.access.ensureOwnerAccess(req.user);
    }
    return this.catalog.listServices(businessId, {
      search: query.search,
      active: query.active,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined
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
    void logAdminAction(this.audit, req, {
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
    void logAdminAction(this.audit, req, {
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
    void logAdminAction(this.audit, req, {
      action: "delete",
      entity: "service",
      entityId: serviceId,
      businessId
    });
    return deleted;
  }
}
