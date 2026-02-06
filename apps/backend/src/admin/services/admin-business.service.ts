import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Business } from "../../schemas/business.schema.js";
import { UpdateBusinessDto } from "../dto/update-business.dto.js";
import { UpdateHoursDto } from "../dto/update-hours.dto.js";
import { UpdatePoliciesDto } from "../dto/update-policies.dto.js";
import { AdminBusinessContextService } from "./admin-business-context.service.js";
import { ERR_BUSINESS_NOT_FOUND, ERR_NO_UPDATES } from "./admin.constants.js";

@Injectable()
export class AdminBusinessService {
  constructor(
    @InjectModel(Business.name) private readonly businessModel: Model<Business>,
    private readonly businessContext: AdminBusinessContextService
  ) {}

  async getBusiness(businessId: string) {
    return this.businessContext.getBusinessContext(businessId);
  }

  async getPolicies(businessId: string) {
    const business = await this.businessContext.getBusinessContext(businessId);
    return business.policies;
  }

  async getHours(businessId: string) {
    const business = await this.businessContext.getBusinessContext(businessId);
    return business.hours;
  }

  async updateBusiness(businessId: string, payload: UpdateBusinessDto) {
    await this.businessContext.getBusinessContext(businessId);

    if (!payload || Object.keys(payload).length === 0) {
      throw new BadRequestException(ERR_NO_UPDATES);
    }

    const business = await this.businessModel
      .findOneAndUpdate({ _id: businessId }, { $set: payload }, { new: true })
      .lean();

    if (!business) {
      throw new NotFoundException(ERR_BUSINESS_NOT_FOUND);
    }

    return business;
  }

  async updatePolicies(businessId: string, payload: UpdatePoliciesDto) {
    await this.businessContext.getBusinessContext(businessId);

    const update: Record<string, unknown> = {};
    if (payload.cancellationHours !== undefined) {
      update["policies.cancellationHours"] = payload.cancellationHours;
    }
    if (payload.rescheduleLimit !== undefined) {
      update["policies.rescheduleLimit"] = payload.rescheduleLimit;
    }
    if (payload.allowSameDay !== undefined) {
      update["policies.allowSameDay"] = payload.allowSameDay;
    }
    if (Object.keys(update).length === 0) {
      throw new BadRequestException(ERR_NO_UPDATES);
    }

    const business = await this.businessModel
      .findOneAndUpdate({ _id: businessId }, { $set: update }, { new: true })
      .lean();

    if (!business) {
      throw new NotFoundException(ERR_BUSINESS_NOT_FOUND);
    }

    return business.policies;
  }

  async updateHours(businessId: string, payload: UpdateHoursDto) {
    await this.businessContext.getBusinessContext(businessId);

    if (!payload.hours || payload.hours.length === 0) {
      throw new BadRequestException("Hours are required.");
    }

    const business = await this.businessModel
      .findOneAndUpdate({ _id: businessId }, { $set: { hours: payload.hours } }, { new: true })
      .lean();

    if (!business) {
      throw new NotFoundException(ERR_BUSINESS_NOT_FOUND);
    }

    return business.hours;
  }
}
