import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class UpdatePlatformUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  businessId?: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsString()
  role?: "owner" | "staff" | "platform_admin";

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
