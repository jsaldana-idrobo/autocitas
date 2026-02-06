import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema, Types } from "mongoose";
import type { Document } from "mongoose";

export type AppointmentDocument = Appointment & Document;

export type AppointmentStatus = "booked" | "cancelled" | "completed";

@Schema({ timestamps: true })
export class Appointment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Business", required: true, index: true })
  businessId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Service", required: true, index: true })
  serviceId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Resource" })
  resourceId?: Types.ObjectId;

  @Prop({ required: true })
  customerName!: string;

  @Prop({ required: true })
  customerPhone!: string;

  @Prop({ required: true })
  startTime!: Date;

  @Prop({ required: true })
  endTime!: Date;

  @Prop({ default: "booked" })
  status!: AppointmentStatus;

  @Prop({ default: 0 })
  rescheduleCount!: number;

  @Prop()
  lastRescheduledAt?: Date;

  @Prop({ type: [Number], default: [] })
  reminderSentHours!: number[];
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
AppointmentSchema.index({ businessId: 1, startTime: 1, endTime: 1 });
AppointmentSchema.index({ resourceId: 1, startTime: 1, endTime: 1 });
AppointmentSchema.index({ businessId: 1, status: 1, startTime: 1 });
AppointmentSchema.index({ businessId: 1, customerPhone: 1, startTime: -1 });
AppointmentSchema.index({ customerName: "text" });
