import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, isValidObjectId } from "mongoose";
import { Appointment } from "../../schemas/appointment.schema";
import { AdminUser } from "../../schemas/admin-user.schema";
import { Business } from "../../schemas/business.schema";
import { CreateBusinessDto } from "../dto/create-business.dto";
import { UpdateBusinessDto } from "../dto/update-business.dto";
import { CreateOwnerDto } from "../dto/create-owner.dto";
import { UpdatePlatformUserDto } from "../dto/update-platform-user.dto";
import { hash } from "bcryptjs";
import { ERR_INVALID_DATE_FORMAT } from "./admin.constants";

const SELECT_WITHOUT_PASSWORD = "-passwordHash";

@Injectable()
export class AdminPlatformService {
  constructor(
    @InjectModel(Business.name) private readonly businessModel: Model<Business>,
    @InjectModel(AdminUser.name) private readonly adminUserModel: Model<AdminUser>,
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<Appointment>
  ) {}

  async listBusinesses() {
    return this.businessModel.find().lean();
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

  async listPlatformUsers(role: "owner" | "staff") {
    return this.adminUserModel.find({ role }).select(SELECT_WITHOUT_PASSWORD).lean();
  }

  async updateBusiness(businessId: string, payload: UpdateBusinessDto) {
    if (!isValidObjectId(businessId)) {
      throw new BadRequestException("Invalid businessId.");
    }
    const update: Record<string, unknown> = {};
    if (payload.name) update.name = payload.name;
    if (payload.slug) update.slug = payload.slug;
    if (payload.timezone) update.timezone = payload.timezone;
    if (payload.contactPhone !== undefined) update.contactPhone = payload.contactPhone;
    if (payload.address !== undefined) update.address = payload.address;
    if (payload.status) update.status = payload.status;
    if (Object.keys(update).length === 0) {
      throw new BadRequestException("No updates provided.");
    }

    const business = await this.businessModel
      .findOneAndUpdate({ _id: businessId }, { $set: update }, { new: true })
      .lean();
    if (!business) {
      throw new BadRequestException("Business not found.");
    }
    return business;
  }

  async deleteBusiness(businessId: string) {
    if (!isValidObjectId(businessId)) {
      throw new BadRequestException("Invalid businessId.");
    }
    const business = await this.businessModel.findOneAndDelete({ _id: businessId }).lean();
    if (!business) {
      throw new BadRequestException("Business not found.");
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
      throw new BadRequestException("No updates provided.");
    }

    const user = await this.adminUserModel
      .findOneAndUpdate({ _id: userId }, { $set: update }, { new: true })
      .select(SELECT_WITHOUT_PASSWORD)
      .lean();
    if (!user) {
      throw new BadRequestException("User not found.");
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
      throw new BadRequestException("User not found.");
    }
    return user;
  }

  async listPlatformAppointmentsWithSearch(
    date?: string,
    status?: "booked" | "cancelled" | "completed",
    search?: string
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
    if (search) {
      const trimmed = search.trim();
      if (trimmed.length > 0) {
        query.$or = [
          { customerName: { $regex: trimmed, $options: "i" } },
          { customerPhone: { $regex: trimmed, $options: "i" } }
        ];
      }
    }

    return this.appointmentModel.find(query).lean();
  }
}
