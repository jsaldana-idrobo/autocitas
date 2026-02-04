import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class CreateStaffDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  resourceId!: string;

  @IsOptional()
  @IsString()
  role?: "staff";
}
