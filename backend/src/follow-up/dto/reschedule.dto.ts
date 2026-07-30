import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RescheduleDto {
  @ApiProperty({ description: 'New ISO scheduled date' })
  @IsDateString()
  scheduledDate!: string;
}
