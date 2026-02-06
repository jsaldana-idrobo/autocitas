import { Body, Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { UpdateBusinessDto } from "../dto/update-business.dto.js";
import { UpdateHoursDto } from "../dto/update-hours.dto.js";
import { UpdatePoliciesDto } from "../dto/update-policies.dto.js";
import { JwtAuthGuard } from "../guards/jwt-auth.guard.js";
import { AdminAccessService } from "../services/admin-access.service.js";
import { AdminBusinessService } from "../services/admin-business.service.js";
import { AuditService } from "../../audit/audit.service.js";
import { AuthenticatedRequest, logAdminAction } from "./admin-controller.helpers.js";

@Controller("admin/businesses")
@UseGuards(JwtAuthGuard)
export class AdminBusinessController {
  constructor(
    private readonly access: AdminAccessService,
    private readonly business: AdminBusinessService,
    private readonly audit: AuditService
  ) {}

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

  @Patch(":businessId")
  updateBusiness(
    @Param("businessId") businessId: string,
    @Body() body: UpdateBusinessDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensureBusinessAccess(req.user, businessId);
    this.access.ensureOwnerAccess(req.user);
    const updated = this.business.updateBusiness(businessId, body);
    void logAdminAction(this.audit, req, {
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
    void logAdminAction(this.audit, req, {
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
    void logAdminAction(this.audit, req, {
      action: "update",
      entity: "hours",
      businessId,
      metadata: { payload: body }
    });
    return updated;
  }
}
