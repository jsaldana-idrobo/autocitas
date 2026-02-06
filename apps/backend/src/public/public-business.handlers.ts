import type { Model } from "mongoose";
import { Business } from "../schemas/business.schema.js";
import { Resource } from "../schemas/resource.schema.js";
import { Service } from "../schemas/service.schema.js";
import { assertActiveBusiness } from "./public.service.helpers.js";

export async function getPublicBusiness(
  businessModel: Model<Business>,
  serviceModel: Model<Service>,
  resourceModel: Model<Resource>,
  slug: string
) {
  const business = await businessModel.findOne({ slug }).lean();
  assertActiveBusiness(business);

  const [services, resources] = await Promise.all([
    serviceModel.find({ businessId: business._id, active: true }).lean(),
    resourceModel.find({ businessId: business._id, active: true }).lean()
  ]);

  return {
    business,
    services,
    resources
  };
}
