import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, isValidObjectId } from "mongoose";
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
    const hasSearch = searchTerm.length > 0;
    if (hasSearch) {
      query.$text = { $search: searchTerm };
    }
    if (options?.active === "true") query.active = true;
    if (options?.active === "false") query.active = false;

    if (options?.page && options?.limit) {
      const total = await this.resourceModel.countDocuments(query);
      const baseQuery = applyTextSearchSort(this.resourceModel.find(query), hasSearch, { name: 1 });
      const items = await baseQuery
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean();
      return { items, total, page: options.page, limit: options.limit };
    }

    return applyTextSearchSort(this.resourceModel.find(query), hasSearch, { name: 1 }).lean();
  }

  async createResource(businessId: string, payload: CreateResourceDto) {
    await this.businessContext.getBusinessContext(businessId);

    return this.resourceModel.create({
      businessId,
      name: payload.name,
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

    const resource = await this.resourceModel
      .findOneAndUpdate({ _id: resourceId, businessId }, payload, { new: true })
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
