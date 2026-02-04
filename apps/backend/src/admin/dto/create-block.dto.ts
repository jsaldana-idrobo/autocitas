import { IsISO8601, IsOptional, IsString } from "class-validator";

export class CreateBlockDto {
  @IsISO8601()
  startTime!: string;

  @IsISO8601()
  endTime!: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
