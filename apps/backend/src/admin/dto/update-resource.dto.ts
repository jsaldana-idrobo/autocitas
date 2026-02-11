import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
