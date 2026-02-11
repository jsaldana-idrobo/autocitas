import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateResourceDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
