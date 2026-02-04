import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, isValidObjectId } from "mongoose";
import { hash } from "bcryptjs";
import { AdminUser } from "../../schemas/admin-user.schema";
import { CreateStaffDto } from "../dto/create-staff.dto";
import { UpdateStaffDto } from "../dto/update-staff.dto";
import { AdminBusinessContextService } from "./admin-business-context.service";
import { AdminCatalogService } from "./admin-catalog.service";
import { ERR_INVALID_RESOURCE_ID } from "./admin.constants";

const SELECT_WITHOUT_PASSWORD = "-passwordHash";

@Injectable()
export class AdminStaffService {
  constructor(
    @InjectModel(AdminUser.name) private readonly adminUserModel: Model<AdminUser>,
    private readonly businessContext: AdminBusinessContextService,
    private readonly catalogService: AdminCatalogService
  ) {}

  async listStaff(businessId: string) {
    await this.businessContext.getBusinessContext(businessId);
    return this.adminUserModel
      .find({ businessId, role: { $in: ["owner", "staff"] } })
      .select(SELECT_WITHOUT_PASSWORD)
      .lean();
  }

  async createStaff(businessId: string, payload: CreateStaffDto) {
    await this.businessContext.getBusinessContext(businessId);

    if (!isValidObjectId(payload.resourceId)) {
      throw new BadRequestException(ERR_INVALID_RESOURCE_ID);
    }

    await this.catalogService.assertResource(businessId, payload.resourceId);

    const passwordHash = await hash(payload.password, 10);

    return this.adminUserModel.create({
      businessId,
      email: payload.email.toLowerCase(),
      passwordHash,
      role: "staff",
      resourceId: payload.resourceId,
      active: true
    });
  }

  async updateStaff(businessId: string, staffId: string, payload: UpdateStaffDto) {
    await this.businessContext.getBusinessContext(businessId);

    if (!isValidObjectId(staffId)) {
      throw new BadRequestException("Invalid staffId.");
    }

    if (!payload || Object.keys(payload).length === 0) {
      throw new BadRequestException("No updates provided.");
    }

    const update: Record<string, unknown> = { ...payload };

    if (payload.resourceId) {
      await this.catalogService.assertResource(businessId, payload.resourceId);
    }

    if (payload.password) {
      update.passwordHash = await hash(payload.password, 10);
      delete update.password;
    }

    const staff = await this.adminUserModel
      .findOneAndUpdate({ _id: staffId, businessId }, update, { new: true })
      .select(SELECT_WITHOUT_PASSWORD)
      .lean();

    if (!staff) {
      throw new BadRequestException("Staff not found.");
    }

    return staff;
  }

  async deleteStaff(businessId: string, staffId: string) {
    await this.businessContext.getBusinessContext(businessId);

    if (!isValidObjectId(staffId)) {
      throw new BadRequestException("Invalid staffId.");
    }

    const staff = await this.adminUserModel
      .findOneAndDelete({ _id: staffId, businessId, role: "staff" })
      .select(SELECT_WITHOUT_PASSWORD)
      .lean();

    if (!staff) {
      throw new BadRequestException("Staff not found.");
    }

    return staff;
  }
}
