import { ForbiddenException, Injectable } from "@nestjs/common";
import { JwtPayload } from "../auth/jwt.strategy";

@Injectable()
export class AdminAccessService {
  ensureBusinessAccess(user: JwtPayload, businessId: string) {
    if (user.role === "platform_admin") {
      return;
    }
    if (user.businessId !== businessId) {
      throw new ForbiddenException("Access denied for this business");
    }
  }

  ensureOwnerAccess(user: JwtPayload) {
    if (user.role !== "owner" && user.role !== "platform_admin") {
      throw new ForbiddenException("Owner access required");
    }
  }

  ensurePlatformAdmin(user: JwtPayload) {
    if (user.role !== "platform_admin") {
      throw new ForbiddenException("Platform admin access required");
    }
  }

  ensureStaffAccess(user: JwtPayload) {
    if (user.role !== "staff") {
      throw new ForbiddenException("Staff access required");
    }
  }
}
