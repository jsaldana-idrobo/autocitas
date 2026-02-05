import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { MongooseModule } from "@nestjs/mongoose";
import { Appointment, AppointmentSchema } from "../schemas/appointment.schema";
import { AdminUser, AdminUserSchema } from "../schemas/admin-user.schema";
import { Block, BlockSchema } from "../schemas/block.schema";
import { Business, BusinessSchema } from "../schemas/business.schema";
import { Resource, ResourceSchema } from "../schemas/resource.schema";
import { Service, ServiceSchema } from "../schemas/service.schema";
import { AdminController } from "./admin.controller";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { JwtStrategy } from "./auth/jwt.strategy";
import { PlatformController } from "./platform.controller";
import { AdminAccessService } from "./services/admin-access.service";
import { AdminAppointmentsService } from "./services/admin-appointments.service";
import { AdminBlocksService } from "./services/admin-blocks.service";
import { AdminBusinessContextService } from "./services/admin-business-context.service";
import { AdminBusinessService } from "./services/admin-business.service";
import { AdminCatalogService } from "./services/admin-catalog.service";
import { AdminPlatformService } from "./services/admin-platform.service";
import { AdminStaffService } from "./services/admin-staff.service";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "dev_secret",
      signOptions: { expiresIn: "7d" }
    }),
    AuditModule,
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Resource.name, schema: ResourceSchema },
      { name: Block.name, schema: BlockSchema }
    ])
  ],
  controllers: [AuthController, AdminController, PlatformController],
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
