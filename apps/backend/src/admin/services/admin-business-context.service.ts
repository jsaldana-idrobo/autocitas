import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, isValidObjectId } from "mongoose";
import { Business } from "../../schemas/business.schema.js";
import { ERR_BUSINESS_NOT_FOUND } from "./admin.constants.js";

@Injectable()
export class AdminBusinessContextService {
  constructor(@InjectModel(Business.name) private readonly businessModel: Model<Business>) {}

  async getBusinessContext(businessId: string) {
    if (!isValidObjectId(businessId)) {
      throw new BadRequestException("Invalid businessId.");
    }

    const business = await this.businessModel.findById(businessId).lean();
    if (!business) {
      throw new NotFoundException(ERR_BUSINESS_NOT_FOUND);
    }

    return business;
  }
}
