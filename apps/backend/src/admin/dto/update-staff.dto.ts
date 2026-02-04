import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
