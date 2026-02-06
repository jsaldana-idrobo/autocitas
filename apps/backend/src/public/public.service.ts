import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Appointment } from "../schemas/appointment.schema.js";
import { Block } from "../schemas/block.schema.js";
import { Business } from "../schemas/business.schema.js";
import { Resource } from "../schemas/resource.schema.js";
import { Service } from "../schemas/service.schema.js";
import { CancelAppointmentDto } from "./dto/cancel-appointment.dto.js";
import { CreateAppointmentDto } from "./dto/create-appointment.dto.js";
import { RescheduleAppointmentDto } from "./dto/reschedule-appointment.dto.js";
import { UpdatePublicAppointmentDto } from "./dto/update-public-appointment.dto.js";
import { getPublicBusiness } from "./public-business.handlers.js";
import { getAvailability } from "./public-availability.handlers.js";
import { cancelAppointment, updatePublicAppointment } from "./public-appointments.manage.js";
import { createAppointment } from "./public-appointments.create.js";
import { listAppointmentsByPhone } from "./public-appointments.list.js";
import { rescheduleAppointment } from "./public-appointments.reschedule.js";

export class PublicService {
  constructor(
    @InjectModel(Business.name) private readonly businessModel: Model<Business>,
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
    @InjectModel(Resource.name) private readonly resourceModel: Model<Resource>,
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<Appointment>,
    @InjectModel(Block.name) private readonly blockModel: Model<Block>
  ) {}

  async getPublicBusiness(slug: string) {
    return getPublicBusiness(this.businessModel, this.serviceModel, this.resourceModel, slug);
  }

  async getAvailability(params: {
    slug: string;
    date: string;
    serviceId: string;
    resourceId?: string;
  }) {
    return getAvailability(
      this.businessModel,
      this.serviceModel,
      this.resourceModel,
      this.appointmentModel,
      this.blockModel,
      params
    );
  }

  async createAppointment(slug: string, payload: CreateAppointmentDto) {
    return createAppointment(
      this.businessModel,
      this.serviceModel,
      this.appointmentModel,
      this.blockModel,
      slug,
      payload
    );
  }

  async listAppointmentsByPhone(slug: string, phone?: string) {
    return listAppointmentsByPhone(this.businessModel, this.appointmentModel, slug, phone);
  }

  async cancelAppointment(slug: string, appointmentId: string, payload: CancelAppointmentDto) {
    return cancelAppointment(
      this.businessModel,
      this.appointmentModel,
      slug,
      appointmentId,
      payload
    );
  }

  async rescheduleAppointment(
    slug: string,
    appointmentId: string,
    payload: RescheduleAppointmentDto
  ) {
    return rescheduleAppointment(
      this.businessModel,
      this.serviceModel,
      this.appointmentModel,
      this.blockModel,
      slug,
      appointmentId,
      payload
    );
  }

  async updatePublicAppointment(
    slug: string,
    appointmentId: string,
    payload: UpdatePublicAppointmentDto
  ) {
    return updatePublicAppointment(
      this.businessModel,
      this.appointmentModel,
      slug,
      appointmentId,
      payload
    );
  }
}
