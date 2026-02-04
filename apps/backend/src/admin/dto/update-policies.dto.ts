import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";

export class UpdatePoliciesDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  cancellationHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  rescheduleLimit?: number;

  @IsOptional()
  @IsBoolean()
  allowSameDay?: boolean;
}
