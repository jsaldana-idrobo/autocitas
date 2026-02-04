import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { AdminService } from "./admin.service";
import { CreateBusinessDto } from "./dto/create-business.dto";
import { CreateOwnerDto } from "./dto/create-owner.dto";
import { JwtPayload } from "./auth/jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller("admin/platform")
@UseGuards(JwtAuthGuard)
export class PlatformController {
  constructor(private readonly adminService: AdminService) {}

  @Get("businesses")
  listBusinesses(@Req() req: AuthenticatedRequest) {
    this.adminService.ensurePlatformAdmin(req.user);
    return this.adminService.listBusinesses();
  }

  @Post("businesses")
  createBusiness(@Body() body: CreateBusinessDto, @Req() req: AuthenticatedRequest) {
    this.adminService.ensurePlatformAdmin(req.user);
    return this.adminService.createBusiness(body);
  }

  @Post("owners")
  createOwner(@Body() body: CreateOwnerDto, @Req() req: AuthenticatedRequest) {
    this.adminService.ensurePlatformAdmin(req.user);
    return this.adminService.createOwner(body);
  }

  @Get("users")
  listUsers(@Query("role") role: "owner" | "staff", @Req() req: AuthenticatedRequest) {
    this.adminService.ensurePlatformAdmin(req.user);
    return this.adminService.listPlatformUsers(role);
  }

  @Get("appointments")
  listAppointments(
    @Query("date") date: string | undefined,
    @Query("status") status: "booked" | "cancelled" | "completed" | undefined,
    @Query("search") search: string | undefined,
    @Req() req: AuthenticatedRequest
  ) {
    this.adminService.ensurePlatformAdmin(req.user);
    return this.adminService.listPlatformAppointmentsWithSearch(date, status, search);
  }
}
