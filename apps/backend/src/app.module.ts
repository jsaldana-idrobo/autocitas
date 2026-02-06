import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AdminModule } from "./admin/admin.module.js";
import { PublicModule } from "./public/public.module.js";
import { HealthController } from "./health.controller.js";
import { ScheduleModule } from "@nestjs/schedule";
import { NotificationsModule } from "./notifications/notifications.module.js";

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || "mongodb://localhost:27017/autocitas"),
    ScheduleModule.forRoot(),
    AdminModule,
    PublicModule,
    NotificationsModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
