import { IsString } from "class-validator";

export class CancelAppointmentDto {
  @IsString()
  customerPhone!: string;
}
