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
import { CreateStaffDto } from "../dto/create-staff.dto.js";
import { UpdateStaffDto } from "../dto/update-staff.dto.js";
import { JwtAuthGuard } from "../guards/jwt-auth.guard.js";
import { AdminAccessService } from "../services/admin-access.service.js";
import { AdminStaffService } from "../services/admin-staff.service.js";
import { AuditService } from "../../audit/audit.service.js";
import type { AuthenticatedRequest } from "./admin-controller.helpers.js";
import { logAdminAction } from "./admin-controller.helpers.js";

@Controller("admin/businesses")
@UseGuards(JwtAuthGuard)
export class AdminStaffController {
  constructor(
    private readonly access: AdminAccessService,
    private readonly staff: AdminStaffService,
    private readonly audit: AuditService
  ) {}

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
    void logAdminAction(this.audit, req, {
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
    void logAdminAction(this.audit, req, {
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
    void logAdminAction(this.audit, req, {
      action: "delete",
      entity: "staff",
      entityId: staffId,
      businessId
    });
    return deleted;
  }
}
