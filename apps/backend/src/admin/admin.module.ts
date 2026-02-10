import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { MongooseModule } from "@nestjs/mongoose";
import { Appointment, AppointmentSchema } from "../schemas/appointment.schema.js";
import { AdminUser, AdminUserSchema } from "../schemas/admin-user.schema.js";
import { Block, BlockSchema } from "../schemas/block.schema.js";
import { Business, BusinessSchema } from "../schemas/business.schema.js";
import { Resource, ResourceSchema } from "../schemas/resource.schema.js";
import { Service, ServiceSchema } from "../schemas/service.schema.js";
import { AdminAppointmentsController } from "./controllers/admin-appointments.controller.js";
import { AdminBlocksController } from "./controllers/admin-blocks.controller.js";
import { AdminBusinessController } from "./controllers/admin-business.controller.js";
import { AdminResourcesController } from "./controllers/admin-resources.controller.js";
import { AdminServicesController } from "./controllers/admin-services.controller.js";
import { AdminStaffController } from "./controllers/admin-staff.controller.js";
import { AuthController } from "./auth/auth.controller.js";
import { AuthService } from "./auth/auth.service.js";
import { JwtStrategy } from "./auth/jwt.strategy.js";
import { PlatformController } from "./platform.controller.js";
import { AdminAccessService } from "./services/admin-access.service.js";
import { AdminAppointmentsService } from "./services/admin-appointments.service.js";
import { AdminBlocksService } from "./services/admin-blocks.service.js";
import { AdminBusinessContextService } from "./services/admin-business-context.service.js";
import { AdminBusinessService } from "./services/admin-business.service.js";
import { AdminCatalogService } from "./services/admin-catalog.service.js";
import { AdminPlatformService } from "./services/admin-platform.service.js";
import { AdminStaffService } from "./services/admin-staff.service.js";
import { AuditModule } from "../audit/audit.module.js";
import { NotificationsModule } from "../notifications/notifications.module.js";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "dev_secret",
      signOptions: { expiresIn: "7d" }
    }),
    AuditModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Resource.name, schema: ResourceSchema },
      { name: Block.name, schema: BlockSchema }
    ])
  ],
  controllers: [
    AuthController,
    AdminAppointmentsController,
    AdminBlocksController,
    AdminBusinessController,
    AdminResourcesController,
    AdminServicesController,
    AdminStaffController,
    PlatformController
  ],
  providers: [
    AuthService,
    AdminAccessService,
    AdminAppointmentsService,
    AdminBlocksService,
    AdminBusinessContextService,
    AdminBusinessService,
    AdminCatalogService,
    AdminPlatformService,
    AdminStaffService,
    JwtStrategy
  ]
})
export class AdminModule {}
