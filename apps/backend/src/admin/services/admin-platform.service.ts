import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, isValidObjectId } from "mongoose";
import { Appointment } from "../../schemas/appointment.schema";
import { AdminUser } from "../../schemas/admin-user.schema";
import { Business } from "../../schemas/business.schema";
import { Resource } from "../../schemas/resource.schema";
import { Service } from "../../schemas/service.schema";
import { Block } from "../../schemas/block.schema";
import { CreateBusinessDto } from "../dto/create-business.dto";
import { UpdateBusinessDto } from "../dto/update-business.dto";
import { CreateOwnerDto } from "../dto/create-owner.dto";
import { UpdatePlatformUserDto } from "../dto/update-platform-user.dto";
import { hash } from "bcryptjs";
import { ERR_INVALID_DATE_FORMAT } from "./admin.constants";

const SELECT_WITHOUT_PASSWORD = "-passwordHash"; // NOSONAR - field name, not a hard-coded password
const TEXT_SCORE = "textScore";
const ERR_INVALID_BUSINESS_ID = "Invalid businessId.";
const ERR_INVALID_RESOURCE_ID = "Invalid resourceId.";
const ERR_NO_UPDATES = "No updates provided.";
const ERR_BUSINESS_NOT_FOUND = "Business not found.";
const ERR_USER_NOT_FOUND = "User not found.";
const PHONE_SEARCH_REGEX = /^[\d+()\-\s]+$/;

function normalizePhone(value: string) {
  return value.replaceAll(/\s+/g, "").replaceAll(/[^\d+]/g, "");
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

function buildAppointmentSearchQuery(search?: string) {
  const trimmed = search?.trim() ?? "";
  if (!trimmed) {
    return { query: {}, useTextScore: false };
  }
  if (PHONE_SEARCH_REGEX.test(trimmed)) {
    return { query: { customerPhone: normalizePhone(trimmed) }, useTextScore: false };
  }
  return { query: { $text: { $search: trimmed } }, useTextScore: true };
}

@Injectable()
export class AdminPlatformService {
  constructor(
    @InjectModel(Business.name) private readonly businessModel: Model<Business>,
    @InjectModel(AdminUser.name) private readonly adminUserModel: Model<AdminUser>,
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<Appointment>,
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
    @InjectModel(Resource.name) private readonly resourceModel: Model<Resource>,
    @InjectModel(Block.name) private readonly blockModel: Model<Block>
  ) {}

  async listBusinesses(options?: {
    search?: string;
    status?: "active" | "inactive";
    page?: number;
    limit?: number;
  }) {
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
      const total = await this.businessModel.countDocuments(query);
      const baseQuery = applyTextSearchSort(this.businessModel.find(query), hasSearch, { name: 1 });
      const items = await baseQuery
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean();
      return { items, total, page: options.page, limit: options.limit };
    }
    return applyTextSearchSort(this.businessModel.find(query), hasSearch, { name: 1 }).lean();
  }

  async createBusiness(payload: CreateBusinessDto) {
    return this.businessModel.create({
      name: payload.name,
      slug: payload.slug,
      timezone: payload.timezone || "America/Bogota",
      contactPhone: payload.contactPhone,
      address: payload.address,
      status: payload.status || "active"
    });
  }

  async createOwner(payload: CreateOwnerDto) {
    const passwordHash = await hash(payload.password, 10);

    return this.adminUserModel.create({
      businessId: payload.businessId,
      email: payload.email.toLowerCase(),
      passwordHash,
      role: "owner",
      active: true
    });
  }

  async listPlatformUsers(
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

  async updateBusiness(businessId: string, payload: UpdateBusinessDto) {
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

    const business = await this.businessModel
      .findOneAndUpdate({ _id: businessId }, { $set: update }, { new: true })
      .lean();
    if (!business) {
      throw new BadRequestException(ERR_BUSINESS_NOT_FOUND);
    }
    return business;
  }

  async deleteBusiness(businessId: string) {
    if (!isValidObjectId(businessId)) {
      throw new BadRequestException(ERR_INVALID_BUSINESS_ID);
    }
    const business = await this.businessModel.findOneAndDelete({ _id: businessId }).lean();
    if (!business) {
      throw new BadRequestException(ERR_BUSINESS_NOT_FOUND);
    }
    return business;
  }

  async updatePlatformUser(userId: string, payload: UpdatePlatformUserDto) {
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

    const user = await this.adminUserModel
      .findOneAndUpdate({ _id: userId }, { $set: update }, { new: true })
      .select(SELECT_WITHOUT_PASSWORD)
      .lean();
    if (!user) {
      throw new BadRequestException(ERR_USER_NOT_FOUND);
    }
    return user;
  }

  async deletePlatformUser(userId: string) {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException("Invalid userId.");
    }
    const user = await this.adminUserModel
      .findOneAndDelete({ _id: userId })
      .select(SELECT_WITHOUT_PASSWORD)
      .lean();
    if (!user) {
      throw new BadRequestException(ERR_USER_NOT_FOUND);
    }
    return user;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  async listPlatformAppointmentsWithSearch(
    date?: string,
    status?: "booked" | "cancelled" | "completed",
    search?: string,
    page?: number,
    limit?: number
  ) {
    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }
    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new BadRequestException(ERR_INVALID_DATE_FORMAT);
      }
      query.startTime = { $gte: start, $lte: end };
    }
    const searchMeta = buildAppointmentSearchQuery(search);
    Object.assign(query, searchMeta.query);

    if (page && limit) {
      const total = await this.appointmentModel.countDocuments(query);
      const baseQuery = this.appointmentModel.find(query);
      if (searchMeta.useTextScore) {
        baseQuery.select({ score: { $meta: TEXT_SCORE } });
        baseQuery.sort({ score: { $meta: TEXT_SCORE }, startTime: -1 });
      } else {
        baseQuery.sort({ startTime: -1 });
      }
      const items = await baseQuery
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      return { items, total, page, limit };
    }

    const baseQuery = this.appointmentModel.find(query);
    return applyTextSearchSort(baseQuery, searchMeta.useTextScore, { startTime: -1 }).lean();
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  async listPlatformServices(options?: {
    businessId?: string;
    active?: "true" | "false";
    search?: string;
    minDuration?: number;
    maxDuration?: number;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
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
      const total = await this.serviceModel.countDocuments(query);
      const baseQuery = applyTextSearchSort(this.serviceModel.find(query), hasServiceSearch, {
        name: 1
      });
      const items = await baseQuery
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean();
      return { items, total, page: options.page, limit: options.limit };
    }

    return applyTextSearchSort(this.serviceModel.find(query), hasServiceSearch, { name: 1 }).lean();
  }

  async listPlatformResources(options?: {
    businessId?: string;
    active?: "true" | "false";
    search?: string;
    page?: number;
    limit?: number;
  }) {
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
      const total = await this.resourceModel.countDocuments(query);
      const baseQuery = applyTextSearchSort(this.resourceModel.find(query), hasResourceSearch, {
        name: 1
      });
      const items = await baseQuery
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean();
      return { items, total, page: options.page, limit: options.limit };
    }

    return applyTextSearchSort(this.resourceModel.find(query), hasResourceSearch, {
      name: 1
    }).lean();
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  async listPlatformBlocks(options?: {
    businessId?: string;
    resourceId?: string;
    search?: string;
    type?: "resource" | "global";
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
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
      const total = await this.blockModel.countDocuments(query);
      const items = await this.blockModel
        .find(query)
        .sort({ startTime: -1 })
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean();
      return { items, total, page: options.page, limit: options.limit };
    }

    return this.blockModel.find(query).sort({ startTime: -1 }).lean();
  }
}
