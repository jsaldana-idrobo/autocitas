import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Appointment } from "../../schemas/appointment.schema.js";
import { AdminUser } from "../../schemas/admin-user.schema.js";
import { Business } from "../../schemas/business.schema.js";
import { Resource } from "../../schemas/resource.schema.js";
import { Service } from "../../schemas/service.schema.js";
import { Block } from "../../schemas/block.schema.js";
import { CreateBusinessDto } from "../dto/create-business.dto.js";
import { UpdateBusinessDto } from "../dto/update-business.dto.js";
import { CreateOwnerDto } from "../dto/create-owner.dto.js";
import { UpdatePlatformUserDto } from "../dto/update-platform-user.dto.js";
import {
  createBusiness,
  deleteBusiness,
  listBusinesses,
  updateBusiness
} from "./admin-platform.business.js";
import {
  createOwner,
  deletePlatformUser,
  listPlatformUsers,
  updatePlatformUser
} from "./admin-platform.users.js";
import { listPlatformAppointmentsWithSearch } from "./admin-platform.appointments.js";
import {
  listPlatformBlocks,
  listPlatformResources,
  listPlatformServices
} from "./admin-platform.catalog.js";

@Injectable()
export class AdminPlatformService {
  constructor(
    @InjectModel(Business.name) private readonly businessModel: Model<Business>,
    @InjectModel(AdminUser.name) private readonly adminUserModel: Model<AdminUser>,
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<Appointment>,
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
    @InjectModel(Resource.name) private readonly resourceModel: Model<Resource>,
    @InjectModel(Block.name) private readonly blockModel: Model<Block>
  ) {}

  async listBusinesses(options?: {
    search?: string;
    status?: "active" | "inactive";
    page?: number;
    limit?: number;
  }) {
    return listBusinesses(this.businessModel, options);
  }

  async createBusiness(payload: CreateBusinessDto) {
    return createBusiness(this.businessModel, payload);
  }

  async createOwner(payload: CreateOwnerDto) {
    return createOwner(this.adminUserModel, payload);
  }

  async listPlatformUsers(
    role: "owner" | "staff",
    options?: { search?: string; active?: "true" | "false"; page?: number; limit?: number }
  ) {
    return listPlatformUsers(this.adminUserModel, role, options);
  }

  async updateBusiness(businessId: string, payload: UpdateBusinessDto) {
    return updateBusiness(this.businessModel, businessId, payload);
  }

  async deleteBusiness(businessId: string) {
    return deleteBusiness(this.businessModel, businessId);
  }

  async updatePlatformUser(userId: string, payload: UpdatePlatformUserDto) {
    return updatePlatformUser(this.adminUserModel, userId, payload);
  }

  async deletePlatformUser(userId: string) {
    return deletePlatformUser(this.adminUserModel, userId);
  }

  async listPlatformAppointmentsWithSearch(
    date?: string,
    status?: "booked" | "cancelled" | "completed",
    search?: string,
    page?: number,
    limit?: number
  ) {
    return listPlatformAppointmentsWithSearch(
      this.appointmentModel,
      date,
      status,
      search,
      page,
      limit
    );
  }

  async listPlatformServices(options?: {
    businessId?: string;
    active?: "true" | "false";
    search?: string;
    minDuration?: number;
    maxDuration?: number;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    return listPlatformServices(this.serviceModel, options);
  }

  async listPlatformResources(options?: {
    businessId?: string;
    active?: "true" | "false";
    search?: string;
    page?: number;
    limit?: number;
  }) {
    return listPlatformResources(this.resourceModel, options);
  }

  async listPlatformBlocks(options?: {
    businessId?: string;
    resourceId?: string;
    search?: string;
    type?: "resource" | "global";
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    return listPlatformBlocks(this.blockModel, options);
  }
}
