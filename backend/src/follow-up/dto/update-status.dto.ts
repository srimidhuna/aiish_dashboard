import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const STATUS = ['scheduled', 'completed', 'missed', 'lost_to_followup', 'rescheduled'];

export class UpdateStatusDto {
  @ApiProperty({ enum: STATUS })
  @IsIn(STATUS)
  status!: string;
}
