import { IsISO8601, IsOptional, IsString } from "class-validator";

export class CreateAdminAppointmentDto {
  @IsString()
  serviceId!: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsString()
  customerName!: string;

  @IsString()
  customerPhone!: string;

  @IsISO8601()
  startTime!: string;
}
