import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, isValidObjectId } from "mongoose";
import { Resource } from "../../schemas/resource.schema";
import { Service } from "../../schemas/service.schema";
import { CreateResourceDto } from "../dto/create-resource.dto";
import { CreateServiceDto } from "../dto/create-service.dto";
import { UpdateResourceDto } from "../dto/update-resource.dto";
import { UpdateServiceDto } from "../dto/update-service.dto";
import { ERR_INVALID_RESOURCE_ID, ERR_RESOURCE_NOT_FOUND, ERR_NO_UPDATES } from "./admin.constants";
import { AdminBusinessContextService } from "./admin-business-context.service";

@Injectable()
export class AdminCatalogService {
  constructor(
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
    @InjectModel(Resource.name) private readonly resourceModel: Model<Resource>,
    private readonly businessContext: AdminBusinessContextService
  ) {}

  async listServices(businessId: string) {
    await this.businessContext.getBusinessContext(businessId);
    return this.serviceModel.find({ businessId }).lean();
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
      throw new BadRequestException("Invalid serviceId.");
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
      throw new NotFoundException("Service not found");
    }

    return service;
  }

  async listResources(businessId: string) {
    await this.businessContext.getBusinessContext(businessId);
    return this.resourceModel.find({ businessId }).lean();
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
      throw new BadRequestException("Invalid serviceId.");
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
