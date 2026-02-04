import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema, Types } from "mongoose";

export type ServiceDocument = Service & Document;

@Schema({ timestamps: true })
export class Service {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Business", required: true, index: true })
  businessId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, min: 1 })
  durationMinutes!: number;

  @Prop()
  price?: number;

  @Prop({ default: true })
  active!: boolean;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: "Resource", default: [] })
  allowedResourceIds!: Types.ObjectId[];
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
