import { BadRequestException } from "@nestjs/common";
import { Model, isValidObjectId } from "mongoose";
import { hash } from "bcryptjs";
import { AdminUser } from "../../schemas/admin-user.schema";
import { CreateOwnerDto } from "../dto/create-owner.dto";
import { UpdatePlatformUserDto } from "../dto/update-platform-user.dto";
import { applyTextSearchSort } from "./admin-platform.query";

const SELECT_WITHOUT_PASSWORD = "-passwordHash"; // NOSONAR - field name, not a hard-coded password
const ERR_NO_UPDATES = "No updates provided.";
const ERR_USER_NOT_FOUND = "User not found.";

export async function createOwner(adminUserModel: Model<AdminUser>, payload: CreateOwnerDto) {
  const passwordHash = await hash(payload.password, 10);

  return adminUserModel.create({
    businessId: payload.businessId,
    email: payload.email.toLowerCase(),
    passwordHash,
    role: "owner",
    active: true
  });
}

export async function listPlatformUsers(
  adminUserModel: Model<AdminUser>,
  role: "owner" | "staff",
  options?: { search?: string; active?: "true" | "false"; page?: number; limit?: number }
) {
  const query: Record<string, unknown> = { role };
  const searchTerm = options?.search?.trim() ?? "";
  const hasSearch = searchTerm.length > 0;
  if (hasSearch) {
    query.$text = { $search: searchTerm };
  }
  if (options?.active === "true") query.active = true;
  if (options?.active === "false") query.active = false;
  if (options?.page && options?.limit) {
    const total = await adminUserModel.countDocuments(query);
    const baseQuery = applyTextSearchSort(
      adminUserModel.find(query).select(SELECT_WITHOUT_PASSWORD),
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
    adminUserModel.find(query).select(SELECT_WITHOUT_PASSWORD),
    hasSearch,
    { email: 1 }
  ).lean();
}

export async function updatePlatformUser(
  adminUserModel: Model<AdminUser>,
  userId: string,
  payload: UpdatePlatformUserDto
) {
  if (!isValidObjectId(userId)) {
    throw new BadRequestException("Invalid userId.");
  }

  const update: Record<string, unknown> = {};
  if (payload.email) update.email = payload.email.toLowerCase();
  if (payload.role) update.role = payload.role;
  if (payload.active !== undefined) update.active = payload.active;
  if (payload.businessId) update.businessId = payload.businessId;
  if (payload.resourceId) update.resourceId = payload.resourceId;
  if (payload.password) {
    update.passwordHash = await hash(payload.password, 10);
  }
  if (Object.keys(update).length === 0) {
    throw new BadRequestException(ERR_NO_UPDATES);
  }

  const user = await adminUserModel
    .findOneAndUpdate({ _id: userId }, { $set: update }, { new: true })
    .select(SELECT_WITHOUT_PASSWORD)
    .lean();
  if (!user) {
    throw new BadRequestException(ERR_USER_NOT_FOUND);
  }
  return user;
}

export async function deletePlatformUser(adminUserModel: Model<AdminUser>, userId: string) {
  if (!isValidObjectId(userId)) {
    throw new BadRequestException("Invalid userId.");
  }
  const user = await adminUserModel
    .findOneAndDelete({ _id: userId })
    .select(SELECT_WITHOUT_PASSWORD)
    .lean();
  if (!user) {
    throw new BadRequestException(ERR_USER_NOT_FOUND);
  }
  return user;
}
