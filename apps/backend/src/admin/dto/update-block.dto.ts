import { IsISO8601, IsOptional, IsString } from "class-validator";

export class UpdateBlockDto {
  @IsOptional()
  @IsISO8601()
  startTime?: string;

  @IsOptional()
  @IsISO8601()
  endTime?: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
