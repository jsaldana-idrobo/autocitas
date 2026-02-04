import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Appointment, AppointmentSchema } from "../schemas/appointment.schema";
import { Business, BusinessSchema } from "../schemas/business.schema";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Business.name, schema: BusinessSchema }
    ])
  ],
  providers: [NotificationsService]
})
export class NotificationsModule {}
