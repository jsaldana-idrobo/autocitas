import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, isValidObjectId } from "mongoose";
import { hash } from "bcryptjs";
import { Block } from "../schemas/block.schema";
import { Business } from "../schemas/business.schema";
import { Appointment } from "../schemas/appointment.schema";
import { Resource } from "../schemas/resource.schema";
import { Service } from "../schemas/service.schema";
import { AdminUser } from "../schemas/admin-user.schema";
import { CreateBlockDto } from "./dto/create-block.dto";
import { CreateBusinessDto } from "./dto/create-business.dto";
import { CreateOwnerDto } from "./dto/create-owner.dto";
import { CreateResourceDto } from "./dto/create-resource.dto";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { UpdateResourceDto } from "./dto/update-resource.dto";
import { UpdateBlockDto } from "./dto/update-block.dto";
import { UpdateBusinessDto } from "./dto/update-business.dto";
import { UpdatePoliciesDto } from "./dto/update-policies.dto";
import { UpdateHoursDto } from "./dto/update-hours.dto";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { UpdateStaffDto } from "./dto/update-staff.dto";
import { JwtPayload } from "./auth/jwt.strategy";

const DEFAULT_TIMEZONE = "America/Bogota";
const ERR_INVALID_RESOURCE_ID = "Invalid resourceId.";
const ERR_BUSINESS_NOT_FOUND = "Business not found";
const ERR_RESOURCE_NOT_FOUND = "Resource not found";
const ERR_NO_UPDATES = "No updates provided.";

export class AdminService {
  constructor(
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<Appointment>,
    @InjectModel(AdminUser.name) private readonly adminUserModel: Model<AdminUser>,
    @InjectModel(Business.name) private readonly businessModel: Model<Business>,
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
    @InjectModel(Resource.name) private readonly resourceModel: Model<Resource>,
    @InjectModel(Block.name) private readonly blockModel: Model<Block>
  ) {}

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

  ensureBusinessAccess(user: JwtPayload, businessId: string) {
    if (user.role === "platform_admin") {
      return;
    }
    if (user.businessId !== businessId) {
      throw new ForbiddenException("Access denied for this business");
    }
  }

  ensureOwnerAccess(user: JwtPayload) {
    if (user.role !== "owner" && user.role !== "platform_admin") {
      throw new ForbiddenException("Owner access required");
    }
  }

  ensurePlatformAdmin(user: JwtPayload) {
    if (user.role !== "platform_admin") {
      throw new ForbiddenException("Platform admin access required");
    }
  }

  ensureStaffAccess(user: JwtPayload) {
    if (user.role !== "staff") {
      throw new ForbiddenException("Staff access required");
    }
  }

  async listServices(businessId: string) {
    await this.getBusinessContext(businessId);
    return this.serviceModel.find({ businessId }).lean();
  }

  async createService(businessId: string, payload: CreateServiceDto) {
    await this.getBusinessContext(businessId);

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
    await this.getBusinessContext(businessId);

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
    await this.getBusinessContext(businessId);
    return this.resourceModel.find({ businessId }).lean();
  }

  async listBlocks(businessId: string, resourceId?: string) {
    await this.getBusinessContext(businessId);
    const query: Record<string, unknown> = { businessId };
    if (resourceId) {
      query.resourceId = resourceId;
    }
    return this.blockModel.find(query).lean();
  }

  async listStaff(businessId: string) {
    await this.getBusinessContext(businessId);
    return this.adminUserModel
      .find({ businessId, role: { $in: ["owner", "staff"] } })
      .select("-passwordHash")
      .lean();
  }

  async createStaff(businessId: string, payload: CreateStaffDto) {
    await this.getBusinessContext(businessId);

    if (!isValidObjectId(payload.resourceId)) {
      throw new BadRequestException(ERR_INVALID_RESOURCE_ID);
    }

    const resource = await this.resourceModel
      .findOne({ _id: payload.resourceId, businessId })
      .lean();
    if (!resource) {
      throw new NotFoundException(ERR_RESOURCE_NOT_FOUND);
    }

    const passwordHash = await hash(payload.password, 10);

    return this.adminUserModel.create({
      businessId,
      email: payload.email.toLowerCase(),
      passwordHash,
      role: "staff",
      resourceId: payload.resourceId,
      active: true
    });
  }

  async listBusinesses() {
    return this.businessModel.find().lean();
  }

  async createBusiness(payload: CreateBusinessDto) {
    return this.businessModel.create({
      name: payload.name,
      slug: payload.slug,
      timezone: payload.timezone ?? DEFAULT_TIMEZONE,
      contactPhone: payload.contactPhone,
      address: payload.address,
      status: payload.status ?? "active"
    });
  }

  async createOwner(payload: CreateOwnerDto) {
    if (!isValidObjectId(payload.businessId)) {
      throw new BadRequestException("Invalid businessId.");
    }

    const business = await this.businessModel.findById(payload.businessId).lean();
    if (!business) {
      throw new NotFoundException(ERR_BUSINESS_NOT_FOUND);
    }

    const passwordHash = await hash(payload.password, 10);
    return this.adminUserModel.create({
      businessId: payload.businessId,
      email: payload.email.toLowerCase(),
      passwordHash,
      role: "owner",
      active: true
    });
  }

  async updateStaff(businessId: string, staffId: string, payload: UpdateStaffDto) {
    await this.getBusinessContext(businessId);

    if (!isValidObjectId(staffId)) {
      throw new BadRequestException("Invalid staffId.");
    }

    const update: Record<string, unknown> = {};
    if (payload.resourceId) {
      if (!isValidObjectId(payload.resourceId)) {
        throw new BadRequestException(ERR_INVALID_RESOURCE_ID);
      }
      update.resourceId = payload.resourceId;
    }
    if (payload.password) {
      update.passwordHash = await hash(payload.password, 10);
    }
    if (payload.active !== undefined) {
      update.active = payload.active;
    }

    if (Object.keys(update).length === 0) {
      throw new BadRequestException(ERR_NO_UPDATES);
    }

    const staff = await this.adminUserModel
      .findOneAndUpdate({ _id: staffId, businessId, role: "staff" }, update, { new: true })
      .select("-passwordHash")
      .lean();

    if (!staff) {
      throw new NotFoundException("Staff not found");
    }

    return staff;
  }

  async createResource(businessId: string, payload: CreateResourceDto) {
    await this.getBusinessContext(businessId);

    return this.resourceModel.create({
      businessId,
      name: payload.name,
      active: payload.active ?? true
    });
  }

  async updateResource(businessId: string, resourceId: string, payload: UpdateResourceDto) {
    await this.getBusinessContext(businessId);

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

  async createBlock(businessId: string, payload: CreateBlockDto) {
    await this.getBusinessContext(businessId);

    if (payload.resourceId && !isValidObjectId(payload.resourceId)) {
      throw new BadRequestException(ERR_INVALID_RESOURCE_ID);
    }

    const startTime = new Date(payload.startTime);
    const endTime = new Date(payload.endTime);
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException("Invalid block time format.");
    }

    if (endTime <= startTime) {
      throw new BadRequestException("Block endTime must be after startTime.");
    }

    return this.blockModel.create({
      businessId,
      resourceId: payload.resourceId,
      startTime,
      endTime,
      reason: payload.reason
    });
  }

  async updateBlock(
    businessId: string,
    blockId: string,
    payload: UpdateBlockDto,
    resourceId?: string
  ) {
    await this.getBusinessContext(businessId);

    if (!isValidObjectId(blockId)) {
      throw new BadRequestException("Invalid blockId.");
    }

    if (payload.resourceId && !isValidObjectId(payload.resourceId)) {
      throw new BadRequestException(ERR_INVALID_RESOURCE_ID);
    }

    const update: Record<string, unknown> = { ...payload };
    if (payload.startTime) {
      const startTime = new Date(payload.startTime);
      if (Number.isNaN(startTime.getTime())) {
        throw new BadRequestException("Invalid startTime format.");
      }
      update.startTime = startTime;
    }
    if (payload.endTime) {
      const endTime = new Date(payload.endTime);
      if (Number.isNaN(endTime.getTime())) {
        throw new BadRequestException("Invalid endTime format.");
      }
      update.endTime = endTime;
    }
    if (Object.keys(update).length === 0) {
      throw new BadRequestException(ERR_NO_UPDATES);
    }
    if (update.startTime && update.endTime && update.endTime <= update.startTime) {
      throw new BadRequestException("Block endTime must be after startTime.");
    }

    const query: Record<string, unknown> = { _id: blockId, businessId };
    if (resourceId) {
      query.resourceId = resourceId;
    }

    const block = await this.blockModel.findOneAndUpdate(query, update, { new: true }).lean();

    if (!block) {
      throw new NotFoundException("Block not found");
    }

    return block;
  }

  async deleteBlock(businessId: string, blockId: string, resourceId?: string) {
    await this.getBusinessContext(businessId);

    if (!isValidObjectId(blockId)) {
      throw new BadRequestException("Invalid blockId.");
    }

    const query: Record<string, unknown> = { _id: blockId, businessId };
    if (resourceId) {
      query.resourceId = resourceId;
    }

    const block = await this.blockModel.findOneAndDelete(query).lean();
    if (!block) {
      throw new NotFoundException("Block not found");
    }

    return { deleted: true };
  }

  async deleteResource(businessId: string, resourceId: string) {
    await this.getBusinessContext(businessId);

    if (!isValidObjectId(resourceId)) {
      throw new BadRequestException(ERR_INVALID_RESOURCE_ID);
    }

    const resource = await this.resourceModel
      .findOneAndUpdate({ _id: resourceId, businessId }, { active: false }, { new: true })
      .lean();
    if (!resource) {
      throw new NotFoundException(ERR_RESOURCE_NOT_FOUND);
    }

    return { deleted: true };
  }

  async updateBusiness(businessId: string, payload: UpdateBusinessDto) {
    await this.getBusinessContext(businessId);

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException(ERR_NO_UPDATES);
    }

    const business = await this.businessModel
      .findOneAndUpdate({ _id: businessId }, payload, { new: true })
      .lean();

    if (!business) {
      throw new NotFoundException(ERR_BUSINESS_NOT_FOUND);
    }

    return business;
  }

  async getBusiness(businessId: string) {
    await this.getBusinessContext(businessId);
    return this.businessModel.findById(businessId).lean();
  }

  async updatePolicies(businessId: string, payload: UpdatePoliciesDto) {
    await this.getBusinessContext(businessId);

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
    await this.getBusinessContext(businessId);

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

  async listAppointments(
    businessId: string,
    date?: string,
    resourceId?: string,
    status?: "booked" | "cancelled" | "completed"
  ) {
    await this.getBusinessContext(businessId);

    const query: Record<string, unknown> = { businessId };
    if (resourceId) {
      query.resourceId = resourceId;
    }
    if (status) {
      query.status = status;
    }
    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new BadRequestException("Invalid date format. Use YYYY-MM-DD.");
      }
      query.startTime = { $gte: start, $lte: end };
    }

    return this.appointmentModel.find(query).lean();
  }

  async updateAppointmentStatus(
    businessId: string,
    appointmentId: string,
    status: "booked" | "cancelled" | "completed",
    resourceId?: string
  ) {
    await this.getBusinessContext(businessId);

    if (!isValidObjectId(appointmentId)) {
      throw new BadRequestException("Invalid appointmentId.");
    }

    const query: Record<string, unknown> = { _id: appointmentId, businessId };
    if (resourceId) {
      query.resourceId = resourceId;
    }

    const appointment = await this.appointmentModel
      .findOneAndUpdate(query, { status }, { new: true })
      .lean();

    if (!appointment) {
      throw new NotFoundException("Appointment not found");
    }

    return appointment;
  }
}
