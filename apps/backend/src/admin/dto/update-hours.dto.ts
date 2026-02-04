import { Type } from "class-transformer";
import { IsArray, IsInt, IsString, Max, Min, ValidateNested } from "class-validator";

export class BusinessHourDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  openTime!: string;

  @IsString()
  closeTime!: string;
}

export class UpdateHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessHourDto)
  hours!: BusinessHourDto[];
}
