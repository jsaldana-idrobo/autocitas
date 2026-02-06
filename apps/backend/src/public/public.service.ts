import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Appointment } from "../schemas/appointment.schema";
import { Block } from "../schemas/block.schema";
import { Business } from "../schemas/business.schema";
import { Resource } from "../schemas/resource.schema";
import { Service } from "../schemas/service.schema";
import { CancelAppointmentDto } from "./dto/cancel-appointment.dto";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { RescheduleAppointmentDto } from "./dto/reschedule-appointment.dto";
import { UpdatePublicAppointmentDto } from "./dto/update-public-appointment.dto";
import { getPublicBusiness } from "./public-business.handlers";
import { getAvailability } from "./public-availability.handlers";
import { cancelAppointment, updatePublicAppointment } from "./public-appointments.manage";
import { createAppointment } from "./public-appointments.create";
import { listAppointmentsByPhone } from "./public-appointments.list";
import { rescheduleAppointment } from "./public-appointments.reschedule";

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
