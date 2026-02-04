import { IsIn } from "class-validator";

export class UpdateAppointmentDto {
  @IsIn(["booked", "cancelled", "completed"])
  status!: "booked" | "cancelled" | "completed";
}
