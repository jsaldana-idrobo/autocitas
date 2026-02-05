import { IsISO8601, IsOptional, IsString } from "class-validator";

export class UpdatePublicAppointmentDto {
  @IsString()
  customerPhone!: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  newCustomerPhone?: string;

  @IsOptional()
  @IsISO8601()
  startTime?: string;
}
