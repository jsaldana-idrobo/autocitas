import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Appointment, AppointmentSchema } from "../schemas/appointment.schema.js";
import { Business, BusinessSchema } from "../schemas/business.schema.js";
import { NotificationsService } from "./notifications.service.js";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Business.name, schema: BusinessSchema }
    ])
  ],
  providers: [NotificationsService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
