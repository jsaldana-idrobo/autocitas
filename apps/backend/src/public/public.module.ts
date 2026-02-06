import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Appointment, AppointmentSchema } from "../schemas/appointment.schema.js";
import { Block, BlockSchema } from "../schemas/block.schema.js";
import { Business, BusinessSchema } from "../schemas/business.schema.js";
import { Resource, ResourceSchema } from "../schemas/resource.schema.js";
import { Service, ServiceSchema } from "../schemas/service.schema.js";
import { AuditModule } from "../audit/audit.module.js";
import { PublicController } from "./public.controller.js";
import { PublicService } from "./public.service.js";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Business.name, schema: BusinessSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Resource.name, schema: ResourceSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Block.name, schema: BlockSchema }
    ]),
    AuditModule
  ],
  controllers: [PublicController],
  providers: [PublicService]
})
export class PublicModule {}
