import { BadRequestException } from "@nestjs/common";
import { Model, isValidObjectId } from "mongoose";
import { Business } from "../../schemas/business.schema";
import { CreateBusinessDto } from "../dto/create-business.dto";
import { UpdateBusinessDto } from "../dto/update-business.dto";
import { applyTextSearchSort } from "./admin-platform.query";

const ERR_INVALID_BUSINESS_ID = "Invalid businessId.";
const ERR_NO_UPDATES = "No updates provided.";
const ERR_BUSINESS_NOT_FOUND = "Business not found.";

export async function listBusinesses(
  businessModel: Model<Business>,
  options?: { search?: string; status?: "active" | "inactive"; page?: number; limit?: number }
) {
  const query: Record<string, unknown> = {};
  const searchTerm = options?.search?.trim() ?? "";
  const hasSearch = searchTerm.length > 0;
  if (hasSearch) {
    query.$text = { $search: searchTerm };
  }
  if (options?.status) {
    query.status = options.status;
  }
  if (options?.page && options?.limit) {
    const total = await businessModel.countDocuments(query);
    const baseQuery = applyTextSearchSort(businessModel.find(query), hasSearch, { name: 1 });
    const items = await baseQuery
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean();
    return { items, total, page: options.page, limit: options.limit };
  }
  return applyTextSearchSort(businessModel.find(query), hasSearch, { name: 1 }).lean();
}

export async function createBusiness(businessModel: Model<Business>, payload: CreateBusinessDto) {
  return businessModel.create({
    name: payload.name,
    slug: payload.slug,
    timezone: payload.timezone || "America/Bogota",
    contactPhone: payload.contactPhone,
    address: payload.address,
    status: payload.status || "active"
  });
}

export async function updateBusiness(
  businessModel: Model<Business>,
  businessId: string,
  payload: UpdateBusinessDto
) {
  if (!isValidObjectId(businessId)) {
    throw new BadRequestException(ERR_INVALID_BUSINESS_ID);
  }
  const update: Record<string, unknown> = {};
  if (payload.name) update.name = payload.name;
  if (payload.slug) update.slug = payload.slug;
  if (payload.timezone) update.timezone = payload.timezone;
  if (payload.contactPhone !== undefined) update.contactPhone = payload.contactPhone;
  if (payload.address !== undefined) update.address = payload.address;
  if (payload.status) update.status = payload.status;
  if (Object.keys(update).length === 0) {
    throw new BadRequestException(ERR_NO_UPDATES);
  }

  const business = await businessModel
    .findOneAndUpdate({ _id: businessId }, { $set: update }, { new: true })
    .lean();
  if (!business) {
    throw new BadRequestException(ERR_BUSINESS_NOT_FOUND);
  }
  return business;
}

export async function deleteBusiness(businessModel: Model<Business>, businessId: string) {
  if (!isValidObjectId(businessId)) {
    throw new BadRequestException(ERR_INVALID_BUSINESS_ID);
  }
  const business = await businessModel.findOneAndDelete({ _id: businessId }).lean();
  if (!business) {
    throw new BadRequestException(ERR_BUSINESS_NOT_FOUND);
  }
  return business;
}
