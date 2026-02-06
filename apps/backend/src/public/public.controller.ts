import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CreateAppointmentDto } from "./dto/create-appointment.dto.js";
import { CancelAppointmentDto } from "./dto/cancel-appointment.dto.js";
import { RescheduleAppointmentDto } from "./dto/reschedule-appointment.dto.js";
import { UpdatePublicAppointmentDto } from "./dto/update-public-appointment.dto.js";
import { PublicService } from "./public.service.js";
import { AuditService } from "../audit/audit.service.js";

@Controller("public/businesses")
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly audit: AuditService
  ) {}

  @Get(":slug")
  getBusiness(@Param("slug") slug: string) {
    return this.publicService.getPublicBusiness(slug);
  }

  @Get(":slug/availability")
  getAvailability(
    @Param("slug") slug: string,
    @Query("date") date?: string,
    @Query("serviceId") serviceId?: string,
    @Query("resourceId") resourceId?: string
  ) {
    if (!date || !serviceId) {
      return { slots: [] };
    }

    return this.publicService.getAvailability({
      slug,
      date,
      serviceId,
      resourceId
    });
  }

  @Post(":slug/appointments")
  createAppointment(@Param("slug") slug: string, @Body() body: CreateAppointmentDto) {
    const created = this.publicService.createAppointment(slug, body);
    void this.audit.log({
      action: "create",
      entity: "appointment",
      actorType: "customer",
      actorPhone: body.customerPhone,
      metadata: { slug }
    });
    return created;
  }

  @Get(":slug/appointments")
  listAppointments(@Param("slug") slug: string, @Query("phone") phone: string | undefined) {
    return this.publicService.listAppointmentsByPhone(slug, phone);
  }

  @Post(":slug/appointments/:appointmentId/cancel")
  cancelAppointment(
    @Param("slug") slug: string,
    @Param("appointmentId") appointmentId: string,
    @Body() body: CancelAppointmentDto
  ) {
    const result = this.publicService.cancelAppointment(slug, appointmentId, body);
    void this.audit.log({
      action: "cancel",
      entity: "appointment",
      entityId: appointmentId,
      actorType: "customer",
      actorPhone: body.customerPhone,
      metadata: { slug }
    });
    return result;
  }

  @Post(":slug/appointments/:appointmentId/reschedule")
  rescheduleAppointment(
    @Param("slug") slug: string,
    @Param("appointmentId") appointmentId: string,
    @Body() body: RescheduleAppointmentDto
  ) {
    const result = this.publicService.rescheduleAppointment(slug, appointmentId, body);
    void this.audit.log({
      action: "reschedule",
      entity: "appointment",
      entityId: appointmentId,
      actorType: "customer",
      actorPhone: body.customerPhone,
      metadata: { slug, startTime: body.startTime }
    });
    return result;
  }

  @Post(":slug/appointments/:appointmentId/update")
  updateAppointment(
    @Param("slug") slug: string,
    @Param("appointmentId") appointmentId: string,
    @Body() body: UpdatePublicAppointmentDto
  ) {
    const result = this.publicService.updatePublicAppointment(slug, appointmentId, body);
    void this.audit.log({
      action: "update",
      entity: "appointment",
      entityId: appointmentId,
      actorType: "customer",
      actorPhone: body.customerPhone,
      metadata: { slug, payload: body }
    });
    return result;
  }
}
