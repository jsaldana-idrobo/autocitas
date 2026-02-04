import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema, Types } from "mongoose";

export type BlockDocument = Block & Document;

@Schema({ timestamps: true })
export class Block {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Business", required: true, index: true })
  businessId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Resource" })
  resourceId?: Types.ObjectId;

  @Prop({ required: true })
  startTime!: Date;

  @Prop({ required: true })
  endTime!: Date;

  @Prop()
  reason?: string;
}

export const BlockSchema = SchemaFactory.createForClass(Block);
BlockSchema.index({ businessId: 1, startTime: 1, endTime: 1 });
