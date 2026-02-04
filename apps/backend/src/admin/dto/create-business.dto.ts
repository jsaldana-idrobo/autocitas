import { IsIn, IsOptional, IsString } from "class-validator";

export class CreateBusinessDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: "active" | "inactive";
}
