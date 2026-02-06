import { BadRequestException } from "@nestjs/common";
import { isValidObjectId } from "mongoose";
import type { Model } from "mongoose";
import { Block } from "../../schemas/block.schema.js";
import { Resource } from "../../schemas/resource.schema.js";
import { Service } from "../../schemas/service.schema.js";
import { ERR_INVALID_DATE_FORMAT } from "./admin.constants.js";
import { applyTextSearchSort } from "./admin-platform.query.js";

const ERR_INVALID_BUSINESS_ID = "Invalid businessId.";
const ERR_INVALID_RESOURCE_ID = "Invalid resourceId.";

// eslint-disable-next-line sonarjs/cognitive-complexity
export async function listPlatformServices(
  serviceModel: Model<Service>,
  options?: {
    businessId?: string;
    active?: "true" | "false";
    search?: string;
    minDuration?: number;
    maxDuration?: number;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }
) {
  const query: Record<string, unknown> = {};
  if (options?.businessId) {
    if (!isValidObjectId(options.businessId)) {
      throw new BadRequestException(ERR_INVALID_BUSINESS_ID);
    }
    query.businessId = options.businessId;
  }
  if (options?.active === "true") {
    query.active = true;
  }
  if (options?.active === "false") {
    query.active = false;
  }
  const hasMinDuration = options?.minDuration !== undefined;
  const hasMaxDuration = options?.maxDuration !== undefined;
  if (hasMinDuration || hasMaxDuration) {
    const durationQuery: Record<string, number> = {};
    if (hasMinDuration) {
      durationQuery.$gte = options.minDuration!;
    }
    if (hasMaxDuration) {
      durationQuery.$lte = options.maxDuration!;
    }
    query.durationMinutes = durationQuery;
  }
  const hasMinPrice = options?.minPrice !== undefined;
  const hasMaxPrice = options?.maxPrice !== undefined;
  if (hasMinPrice || hasMaxPrice) {
    const priceQuery: Record<string, number> = {};
    if (hasMinPrice) {
      priceQuery.$gte = options.minPrice!;
    }
    if (hasMaxPrice) {
      priceQuery.$lte = options.maxPrice!;
    }
    query.price = priceQuery;
  }
  const serviceSearch = options?.search?.trim() ?? "";
  const hasServiceSearch = serviceSearch.length > 0;
  if (hasServiceSearch) {
    query.$text = { $search: serviceSearch };
  }

  if (options?.page && options?.limit) {
    const total = await serviceModel.countDocuments(query);
    const baseQuery = applyTextSearchSort(serviceModel.find(query), hasServiceSearch, { name: 1 });
    const items = await baseQuery
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean();
    return { items, total, page: options.page, limit: options.limit };
  }

  return applyTextSearchSort(serviceModel.find(query), hasServiceSearch, { name: 1 }).lean();
}

export async function listPlatformResources(
  resourceModel: Model<Resource>,
  options?: {
    businessId?: string;
    active?: "true" | "false";
    search?: string;
    page?: number;
    limit?: number;
  }
) {
  const query: Record<string, unknown> = {};
  if (options?.businessId) {
    if (!isValidObjectId(options.businessId)) {
      throw new BadRequestException(ERR_INVALID_BUSINESS_ID);
    }
    query.businessId = options.businessId;
  }
  if (options?.active === "true") {
    query.active = true;
  }
  if (options?.active === "false") {
    query.active = false;
  }
  const resourceSearch = options?.search?.trim() ?? "";
  const hasResourceSearch = resourceSearch.length > 0;
  if (hasResourceSearch) {
    query.$text = { $search: resourceSearch };
  }

  if (options?.page && options?.limit) {
    const total = await resourceModel.countDocuments(query);
    const baseQuery = applyTextSearchSort(resourceModel.find(query), hasResourceSearch, {
      name: 1
    });
    const items = await baseQuery
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean();
    return { items, total, page: options.page, limit: options.limit };
  }

  return applyTextSearchSort(resourceModel.find(query), hasResourceSearch, { name: 1 }).lean();
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export async function listPlatformBlocks(
  blockModel: Model<Block>,
  options?: {
    businessId?: string;
    resourceId?: string;
    search?: string;
    type?: "resource" | "global";
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }
) {
  const query: Record<string, unknown> = {};
  if (options?.businessId) {
    if (!isValidObjectId(options.businessId)) {
      throw new BadRequestException(ERR_INVALID_BUSINESS_ID);
    }
    query.businessId = options.businessId;
  }
  if (options?.resourceId) {
    if (!isValidObjectId(options.resourceId)) {
      throw new BadRequestException(ERR_INVALID_RESOURCE_ID);
    }
    query.resourceId = options.resourceId;
  }
  if (!options?.resourceId && options?.type === "resource") {
    query.resourceId = { $exists: true };
  }
  if (!options?.resourceId && options?.type === "global") {
    query.$or = [{ resourceId: { $exists: false } }, { resourceId: null }];
  }
  if (options?.from || options?.to) {
    const from = options.from ? new Date(options.from) : undefined;
    const to = options.to ? new Date(options.to) : undefined;
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
      throw new BadRequestException(ERR_INVALID_DATE_FORMAT);
    }
    query.startTime = {
      ...(from ? { $gte: from } : {}),
      ...(to ? { $lte: to } : {})
    };
  }
  if (options?.search) {
    const term = options.search.trim();
    if (term.length > 0) {
      query.reason = { $regex: term, $options: "i" };
    }
  }

  if (options?.page && options?.limit) {
    const total = await blockModel.countDocuments(query);
    const items = await blockModel
      .find(query)
      .sort({ startTime: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean();
    return { items, total, page: options.page, limit: options.limit };
  }

  return blockModel.find(query).sort({ startTime: -1 }).lean();
}
