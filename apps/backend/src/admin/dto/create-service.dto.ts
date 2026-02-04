import { ArrayUnique, IsArray, IsBoolean, IsInt, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateServiceDto {
  @IsString()
  name!: string;

  @IsInt()
  @IsPositive()
  durationMinutes!: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  allowedResourceIds?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
