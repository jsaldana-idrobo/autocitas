import type { Request } from "express";
import { AuditService } from "../../audit/audit.service.js";
import type { JwtPayload } from "../auth/jwt.strategy.js";

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export type AppointmentStatus = "booked" | "cancelled" | "completed";
export type ActiveFilter = "true" | "false";
export const ERR_STAFF_RESOURCE_NOT_LINKED = "Staff resource not linked";

export function logAdminAction(
  audit: AuditService,
  req: AuthenticatedRequest,
  payload: {
    action: string;
    entity: string;
    entityId?: string;
    businessId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  return audit.log({
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
