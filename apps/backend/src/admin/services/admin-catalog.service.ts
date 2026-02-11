import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { isValidObjectId } from "mongoose";
import type { Model } from "mongoose";
import { Resource } from "../../schemas/resource.schema.js";
import { Service } from "../../schemas/service.schema.js";
import { CreateResourceDto } from "../dto/create-resource.dto.js";
import { CreateServiceDto } from "../dto/create-service.dto.js";
import { UpdateResourceDto } from "../dto/update-resource.dto.js";
import { UpdateServiceDto } from "../dto/update-service.dto.js";
import {
  ERR_INVALID_RESOURCE_ID,
  ERR_RESOURCE_NOT_FOUND,
  ERR_NO_UPDATES
} from "./admin.constants.js";
import { AdminBusinessContextService } from "./admin-business-context.service.js";

const TEXT_SCORE = "textScore";
const ERR_INVALID_SERVICE_ID = "Invalid serviceId.";
const ERR_SERVICE_NOT_FOUND = "Service not found";
const DEFAULT_RESOURCE_SLUG = "recurso";

function stripDiacritics(value: string) {
  let result = "";
  for (const char of value.normalize("NFD")) {
    const code = char.charCodeAt(0);
    if (code >= 0x0300 && code <= 0x036f) {
      continue;
    }
    result += char;
  }
  return result;
}

function isAsciiLetterOrDigit(char: string) {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x30 && code <= 0x39) ||
    (code >= 0x61 && code <= 0x7a) ||
    (code >= 0x41 && code <= 0x5a)
  );
}

function escapeRegex(value: string) {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toResourceSlug(value: string) {
  const source = stripDiacritics(value).toLowerCase();
  let normalized = "";
  let lastWasDash = false;

  for (const char of source) {
    if (isAsciiLetterOrDigit(char)) {
      normalized += char;
      lastWasDash = false;
      continue;
    }
    if (normalized.length > 0 && !lastWasDash) {
      normalized += "-";
      lastWasDash = true;
    }
  }

  if (normalized.endsWith("-")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized || DEFAULT_RESOURCE_SLUG;
}

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
export class AdminCatalogService {
  constructor(
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
    @InjectModel(Resource.name) private readonly resourceModel: Model<Resource>,
    private readonly businessContext: AdminBusinessContextService
  ) {}

  private async resolveUniqueResourceSlug(
    businessId: string,
    input: string,
    excludeResourceId?: string
  ) {
    const base = toResourceSlug(input);
    let candidate = base;
    let counter = 2;

    while (
      await this.resourceModel.exists({
        businessId,
        slug: candidate,
        ...(excludeResourceId ? { _id: { $ne: excludeResourceId } } : {})
      })
    ) {
      candidate = `${base}-${counter}`;
      counter += 1;
    }

    return candidate;
  }

  async listServices(
    businessId: string,
    options?: { search?: string; active?: "true" | "false"; page?: number; limit?: number }
  ) {
    await this.businessContext.getBusinessContext(businessId);
    const query: Record<string, unknown> = { businessId };
    const searchTerm = options?.search?.trim() ?? "";
    const hasSearch = searchTerm.length > 0;
    if (hasSearch) {
      query.$text = { $search: searchTerm };
    }
    if (options?.active === "true") query.active = true;
    if (options?.active === "false") query.active = false;

    if (options?.page && options?.limit) {
      const total = await this.serviceModel.countDocuments(query);
      const baseQuery = applyTextSearchSort(this.serviceModel.find(query), hasSearch, { name: 1 });
      const items = await baseQuery
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean();
      return { items, total, page: options.page, limit: options.limit };
    }

    return applyTextSearchSort(this.serviceModel.find(query), hasSearch, { name: 1 }).lean();
  }

  async createService(businessId: string, payload: CreateServiceDto) {
    await this.businessContext.getBusinessContext(businessId);

    const allowedResourceIds = (payload.allowedResourceIds || []).filter((id) =>
      isValidObjectId(id)
    );

    return this.serviceModel.create({
      businessId,
      name: payload.name,
      durationMinutes: payload.durationMinutes,
      price: payload.price,
      active: payload.active ?? true,
      allowedResourceIds
    });
  }

  async updateService(businessId: string, serviceId: string, payload: UpdateServiceDto) {
    await this.businessContext.getBusinessContext(businessId);

    if (!isValidObjectId(serviceId)) {
      throw new BadRequestException(ERR_INVALID_SERVICE_ID);
    }

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException(ERR_NO_UPDATES);
    }

    const update: Record<string, unknown> = { ...payload };
    if (payload.allowedResourceIds) {
      update.allowedResourceIds = payload.allowedResourceIds.filter((id) => isValidObjectId(id));
    }

    const service = await this.serviceModel
      .findOneAndUpdate({ _id: serviceId, businessId }, update, { new: true })
      .lean();

    if (!service) {
      throw new NotFoundException(ERR_SERVICE_NOT_FOUND);
    }

    return service;
  }

  async deleteService(businessId: string, serviceId: string) {
    await this.businessContext.getBusinessContext(businessId);

    if (!isValidObjectId(serviceId)) {
      throw new BadRequestException(ERR_INVALID_SERVICE_ID);
    }

    const service = await this.serviceModel.findOneAndDelete({ _id: serviceId, businessId }).lean();

    if (!service) {
      throw new NotFoundException(ERR_SERVICE_NOT_FOUND);
    }

    return service;
  }

  async listResources(
    businessId: string,
    options?: { search?: string; active?: "true" | "false"; page?: number; limit?: number }
  ) {
    await this.businessContext.getBusinessContext(businessId);
    const query: Record<string, unknown> = { businessId };
    const searchTerm = options?.search?.trim() ?? "";
    if (searchTerm.length > 0) {
      const regex = new RegExp(escapeRegex(searchTerm), "i");
      query.$or = [{ name: regex }, { slug: regex }];
    }
    if (options?.active === "true") query.active = true;
    if (options?.active === "false") query.active = false;

    if (options?.page && options?.limit) {
      const total = await this.resourceModel.countDocuments(query);
      const baseQuery = this.resourceModel.find(query).sort({ name: 1 });
      const items = await baseQuery
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean();
      return { items, total, page: options.page, limit: options.limit };
    }

    return this.resourceModel.find(query).sort({ name: 1 }).lean();
  }

  async createResource(businessId: string, payload: CreateResourceDto) {
    await this.businessContext.getBusinessContext(businessId);
    const slugSource = payload.slug?.trim() || payload.name;
    const slug = await this.resolveUniqueResourceSlug(businessId, slugSource);

    return this.resourceModel.create({
      businessId,
      name: payload.name,
      slug,
      active: payload.active ?? true
    });
  }

  async updateResource(businessId: string, resourceId: string, payload: UpdateResourceDto) {
    await this.businessContext.getBusinessContext(businessId);

    if (!isValidObjectId(resourceId)) {
      throw new BadRequestException(ERR_INVALID_RESOURCE_ID);
    }

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException(ERR_NO_UPDATES);
    }

    const current = await this.resourceModel.findOne({ _id: resourceId, businessId }).lean();
    if (!current) {
      throw new NotFoundException(ERR_RESOURCE_NOT_FOUND);
    }

    const update: Record<string, unknown> = { ...payload };
    if (payload.slug !== undefined) {
      const slugSource = payload.slug.trim() || payload.name?.trim() || current.name;
      update.slug = await this.resolveUniqueResourceSlug(businessId, slugSource, resourceId);
    }

    const resource = await this.resourceModel
      .findOneAndUpdate({ _id: resourceId, businessId }, update, { new: true })
      .lean();

    if (!resource) {
      throw new NotFoundException(ERR_RESOURCE_NOT_FOUND);
    }

    return resource;
  }

  async deleteResource(businessId: string, resourceId: string) {
    await this.businessContext.getBusinessContext(businessId);

    if (!isValidObjectId(resourceId)) {
      throw new BadRequestException(ERR_INVALID_RESOURCE_ID);
    }

    const resource = await this.resourceModel
      .findOneAndDelete({ _id: resourceId, businessId })
      .lean();
    if (!resource) {
      throw new NotFoundException(ERR_RESOURCE_NOT_FOUND);
    }

    await this.serviceModel.updateMany(
      { businessId },
      { $pull: { allowedResourceIds: resourceId } }
    );

    return resource;
  }

  async assertService(businessId: string, serviceId: string) {
    if (!isValidObjectId(serviceId)) {
      throw new BadRequestException(ERR_INVALID_SERVICE_ID);
    }
    const service = await this.serviceModel
      .findOne({ _id: serviceId, businessId, active: true })
      .lean();
    if (!service) {
      throw new NotFoundException("Service not found");
    }
    return service;
  }

  async assertResource(businessId: string, resourceId: string) {
    if (!isValidObjectId(resourceId)) {
      throw new BadRequestException(ERR_INVALID_RESOURCE_ID);
    }
    const resource = await this.resourceModel
      .findOne({ _id: resourceId, businessId, active: true })
      .lean();
    if (!resource) {
      throw new NotFoundException(ERR_RESOURCE_NOT_FOUND);
    }
    return resourceId;
  }
}
