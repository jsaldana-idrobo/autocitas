import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { CreateBusinessDto } from "./dto/create-business.dto";
import { CreateOwnerDto } from "./dto/create-owner.dto";
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
