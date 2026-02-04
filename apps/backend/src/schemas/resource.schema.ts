import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema, Types } from "mongoose";

export type ResourceDocument = Resource & Document;

@Schema({ timestamps: true })
export class Resource {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Business", required: true, index: true })
  businessId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ default: true })
  active!: boolean;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);
