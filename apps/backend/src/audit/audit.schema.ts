import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema } from "mongoose";
import type { Document } from "mongoose";

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true })
  action!: string;

  @Prop({ required: true })
  entity!: string;

  @Prop()
  entityId?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Business" })
  businessId?: string;

  @Prop({ required: true })
  actorType!: "admin" | "customer" | "system";

  @Prop()
  actorId?: string;

  @Prop()
  actorRole?: string;

  @Prop()
  actorPhone?: string;

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, unknown>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ entity: 1, createdAt: -1 });
AuditLogSchema.index({ businessId: 1, createdAt: -1 });
