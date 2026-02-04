import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type BusinessDocument = Business & Document;

@Schema({ _id: false })
export class BusinessPolicies {
  @Prop({ default: 24 })
  cancellationHours!: number;

  @Prop({ default: 1 })
  rescheduleLimit!: number;

  @Prop({ default: true })
  allowSameDay!: boolean;
}

@Schema({ _id: false })
export class BusinessHour {
  @Prop({ required: true, min: 0, max: 6 })
  dayOfWeek!: number;

  @Prop({ required: true })
  openTime!: string;

  @Prop({ required: true })
  closeTime!: string;
}

@Schema({ timestamps: true })
export class Business {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, index: true })
  slug!: string;

  @Prop({ default: "America/Bogota" })
  timezone!: string;

  @Prop()
  contactPhone?: string;

  @Prop()
  address?: string;

  @Prop({ default: "active" })
  status!: "active" | "inactive";

  @Prop({ type: BusinessPolicies, default: {} })
  policies!: BusinessPolicies;

  @Prop({ type: [BusinessHour], default: [] })
  hours!: BusinessHour[];
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
