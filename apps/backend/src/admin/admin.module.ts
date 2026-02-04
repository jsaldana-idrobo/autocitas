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
import { AdminService } from "./admin.service";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { JwtStrategy } from "./auth/jwt.strategy";
import { PlatformController } from "./platform.controller";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "dev_secret",
      signOptions: { expiresIn: "7d" }
    }),
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
  providers: [AuthService, AdminService, JwtStrategy]
})
export class AdminModule {}
