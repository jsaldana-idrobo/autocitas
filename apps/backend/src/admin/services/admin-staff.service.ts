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

const SELECT_WITHOUT_PASSWORD = "-passwordHash"; // NOSONAR - field name, not a hard-coded password
const TEXT_SCORE = "textScore";

function applyTextSearchSort<T>(
  query: ReturnType<Model<T>["find"]>,
  hasSearch: boolean,
  fallbackSort: Record<string, 1 | -1>
) {
  if (hasSearch) {
    query.select({ score: { $meta: TEXT_SCORE } });
    query.sort({ score: { $meta: TEXT_SCORE }, ...fallbackSort });
  } else {
    query.sort(fallbackSort);
  }
  return query;
}

@Injectable()
export class AdminStaffService {
  constructor(
    @InjectModel(AdminUser.name) private readonly adminUserModel: Model<AdminUser>,
    private readonly businessContext: AdminBusinessContextService,
    private readonly catalogService: AdminCatalogService
  ) {}

  async listStaff(
    businessId: string,
    options?: { search?: string; active?: "true" | "false"; page?: number; limit?: number }
  ) {
    await this.businessContext.getBusinessContext(businessId);
    const query: Record<string, unknown> = { businessId, role: { $in: ["owner", "staff"] } };
    const searchTerm = options?.search?.trim() ?? "";
    const hasSearch = searchTerm.length > 0;
    if (hasSearch) {
      query.$text = { $search: searchTerm };
    }
    if (options?.active === "true") query.active = true;
    if (options?.active === "false") query.active = false;

    if (options?.page && options?.limit) {
      const total = await this.adminUserModel.countDocuments(query);
      const baseQuery = applyTextSearchSort(
        this.adminUserModel.find(query).select(SELECT_WITHOUT_PASSWORD),
        hasSearch,
        { email: 1 }
      );
      const items = await baseQuery
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean();
      return { items, total, page: options.page, limit: options.limit };
    }

    return applyTextSearchSort(
      this.adminUserModel.find(query).select(SELECT_WITHOUT_PASSWORD),
      hasSearch,
      { email: 1 }
    ).lean();
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
