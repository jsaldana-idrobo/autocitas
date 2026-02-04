import { IsISO8601, IsString } from "class-validator";

export class RescheduleAppointmentDto {
  @IsString()
  customerPhone!: string;

  @IsISO8601()
  startTime!: string;
}
