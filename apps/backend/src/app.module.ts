import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AdminModule } from "./admin/admin.module";
import { PublicModule } from "./public/public.module";
import { HealthController } from "./health.controller";
import { ScheduleModule } from "@nestjs/schedule";
import { NotificationsModule } from "./notifications/notifications.module";

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
