import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import { AuditLog } from "./audit.schema.js";

export interface AuditPayload {
  action: string;
  entity: string;
  entityId?: string;
  businessId?: string;
  actorType: "admin" | "customer" | "system";
  actorId?: string;
  actorRole?: string;
  actorPhone?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(@InjectModel(AuditLog.name) private readonly auditModel: Model<AuditLog>) {}

  async log(payload: AuditPayload) {
    try {
      await this.auditModel.create({
        ...payload,
        metadata: payload.metadata ?? {}
      });
    } catch {
      // Avoid blocking main flows on audit failures.
    }
  }
}
