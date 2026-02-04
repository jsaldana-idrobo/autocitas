import { IsISO8601, IsOptional, IsString } from "class-validator";

export class UpdateAdminAppointmentDto {
  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsISO8601()
  startTime?: string;
}
