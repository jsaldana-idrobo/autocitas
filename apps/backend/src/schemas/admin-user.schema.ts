import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema, Types } from "mongoose";

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
AdminUserSchema.index({ email: 1 }, { unique: true });
