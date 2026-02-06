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
import { CreateBlockDto } from "../dto/create-block.dto.js";
import { UpdateBlockDto } from "../dto/update-block.dto.js";
import { JwtAuthGuard } from "../guards/jwt-auth.guard.js";
import { AdminAccessService } from "../services/admin-access.service.js";
import { AdminBlocksService } from "../services/admin-blocks.service.js";
import { AuditService } from "../../audit/audit.service.js";
import type { AuthenticatedRequest } from "./admin-controller.helpers.js";
import { ERR_STAFF_RESOURCE_NOT_LINKED, logAdminAction } from "./admin-controller.helpers.js";

@Controller("admin/businesses")
@UseGuards(JwtAuthGuard)
export class AdminBlocksController {
  constructor(
    private readonly access: AdminAccessService,
    private readonly blocks: AdminBlocksService,
    private readonly audit: AuditService
  ) {}

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
      void logAdminAction(this.audit, req, {
        action: "create",
        entity: "block",
        businessId,
        metadata: { payload: body }
      });
      return created;
    }
    const created = this.blocks.createBlock(businessId, body);
    void logAdminAction(this.audit, req, {
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
      void logAdminAction(this.audit, req, {
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
    void logAdminAction(this.audit, req, {
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
      void logAdminAction(this.audit, req, {
        action: "delete",
        entity: "block",
        entityId: blockId,
        businessId
      });
      return deleted;
    }
    this.access.ensureOwnerAccess(req.user);
    const deleted = this.blocks.deleteBlock(businessId, blockId);
    void logAdminAction(this.audit, req, {
      action: "delete",
      entity: "block",
      entityId: blockId,
      businessId
    });
    return deleted;
  }
}
