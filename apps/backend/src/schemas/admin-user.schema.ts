import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema, Types } from "mongoose";
import type { Document } from "mongoose";

export type AdminUserDocument = AdminUser & Document;

@Schema({ timestamps: true })
export class AdminUser {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Business", index: true })
  businessId?: Types.ObjectId;

  @Prop({ required: true, unique: true, lowercase: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ default: "owner" })
  role!: "owner" | "staff" | "platform_admin";

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Resource" })
  resourceId?: Types.ObjectId;

  @Prop({ default: true })
  active!: boolean;
}

export const AdminUserSchema = SchemaFactory.createForClass(AdminUser);
AdminUserSchema.index({ role: 1, active: 1, email: 1 });
AdminUserSchema.index({ businessId: 1, role: 1 });
AdminUserSchema.index({ email: "text" });
