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
import { CreateResourceDto } from "../dto/create-resource.dto.js";
import { UpdateResourceDto } from "../dto/update-resource.dto.js";
import { JwtAuthGuard } from "../guards/jwt-auth.guard.js";
import { AdminAccessService } from "../services/admin-access.service.js";
import { AdminCatalogService } from "../services/admin-catalog.service.js";
import { AuditService } from "../../audit/audit.service.js";
import type { AuthenticatedRequest } from "./admin-controller.helpers.js";
import { logAdminAction } from "./admin-controller.helpers.js";

@Controller("admin/businesses")
@UseGuards(JwtAuthGuard)
export class AdminResourcesController {
  constructor(
    private readonly access: AdminAccessService,
    private readonly catalog: AdminCatalogService,
    private readonly audit: AuditService
  ) {}

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
    void logAdminAction(this.audit, req, {
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
    void logAdminAction(this.audit, req, {
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
    void logAdminAction(this.audit, req, {
      action: "delete",
      entity: "resource",
      entityId: resourceId,
      businessId
    });
    return deleted;
  }
}
