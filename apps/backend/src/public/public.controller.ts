import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { CancelAppointmentDto } from "./dto/cancel-appointment.dto";
import { RescheduleAppointmentDto } from "./dto/reschedule-appointment.dto";
import { PublicService } from "./public.service";

@Controller("public/businesses")
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

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
    return this.publicService.createAppointment(slug, body);
  }

  @Post(":slug/appointments/:appointmentId/cancel")
  cancelAppointment(
    @Param("slug") slug: string,
    @Param("appointmentId") appointmentId: string,
    @Body() body: CancelAppointmentDto
  ) {
    return this.publicService.cancelAppointment(slug, appointmentId, body);
  }

  @Post(":slug/appointments/:appointmentId/reschedule")
  rescheduleAppointment(
    @Param("slug") slug: string,
    @Param("appointmentId") appointmentId: string,
    @Body() body: RescheduleAppointmentDto
  ) {
    return this.publicService.rescheduleAppointment(slug, appointmentId, body);
  }
}
