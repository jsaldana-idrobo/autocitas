import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { Request } from "express";
import { CreateBusinessDto } from "./dto/create-business.dto";
import { CreateOwnerDto } from "./dto/create-owner.dto";
import { UpdateBusinessDto } from "./dto/update-business.dto";
import { UpdatePlatformUserDto } from "./dto/update-platform-user.dto";
import { JwtPayload } from "./auth/jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AdminAccessService } from "./services/admin-access.service";
import { AdminPlatformService } from "./services/admin-platform.service";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller("admin/platform")
@UseGuards(JwtAuthGuard)
export class PlatformController {
  constructor(
    private readonly access: AdminAccessService,
    private readonly platform: AdminPlatformService
  ) {}

  @Get("businesses")
  listBusinesses(@Req() req: AuthenticatedRequest) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.listBusinesses();
  }

  @Post("businesses")
  createBusiness(@Body() body: CreateBusinessDto, @Req() req: AuthenticatedRequest) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.createBusiness(body);
  }

  @Patch("businesses/:businessId")
  updateBusiness(
    @Param("businessId") businessId: string,
    @Body() body: UpdateBusinessDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.updateBusiness(businessId, body);
  }

  @Delete("businesses/:businessId")
  deleteBusiness(@Param("businessId") businessId: string, @Req() req: AuthenticatedRequest) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.deleteBusiness(businessId);
  }

  @Post("owners")
  createOwner(@Body() body: CreateOwnerDto, @Req() req: AuthenticatedRequest) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.createOwner(body);
  }

  @Get("users")
  listUsers(@Query("role") role: "owner" | "staff", @Req() req: AuthenticatedRequest) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.listPlatformUsers(role);
  }

  @Patch("users/:userId")
  updateUser(
    @Param("userId") userId: string,
    @Body() body: UpdatePlatformUserDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.updatePlatformUser(userId, body);
  }

  @Delete("users/:userId")
  deleteUser(@Param("userId") userId: string, @Req() req: AuthenticatedRequest) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.deletePlatformUser(userId);
  }

  @Get("appointments")
  listAppointments(
    @Query("date") date: string | undefined,
    @Query("status") status: "booked" | "cancelled" | "completed" | undefined,
    @Query("search") search: string | undefined,
    @Req() req: AuthenticatedRequest
  ) {
    this.access.ensurePlatformAdmin(req.user);
    return this.platform.listPlatformAppointmentsWithSearch(date, status, search);
  }
}
