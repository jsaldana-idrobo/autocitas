import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Appointment, AppointmentSchema } from "../schemas/appointment.schema";
import { Block, BlockSchema } from "../schemas/block.schema";
import { Business, BusinessSchema } from "../schemas/business.schema";
import { Resource, ResourceSchema } from "../schemas/resource.schema";
import { Service, ServiceSchema } from "../schemas/service.schema";
import { AuditModule } from "../audit/audit.module";
import { PublicController } from "./public.controller";
import { PublicService } from "./public.service";

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
