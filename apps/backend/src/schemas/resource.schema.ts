import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema, Types } from "mongoose";
import type { Document } from "mongoose";

export type ResourceDocument = Resource & Document;

@Schema({ timestamps: true })
export class Resource {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Business", required: true, index: true })
  businessId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop()
  slug?: string;

  @Prop({ default: true })
  active!: boolean;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);
ResourceSchema.index({ businessId: 1, active: 1, name: 1 });
ResourceSchema.index({ businessId: 1, slug: 1 }, { unique: true, sparse: true });
ResourceSchema.index({ name: "text" });
