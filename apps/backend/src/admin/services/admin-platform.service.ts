import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Appointment } from "../../schemas/appointment.schema";
import { AdminUser } from "../../schemas/admin-user.schema";
import { Business } from "../../schemas/business.schema";
import { CreateBusinessDto } from "../dto/create-business.dto";
import { CreateOwnerDto } from "../dto/create-owner.dto";
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
    return this.adminUserModel
      .find({ role })
      .select(SELECT_WITHOUT_PASSWORD)
      .lean();
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
