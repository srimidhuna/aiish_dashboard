import { IsString, IsNotEmpty, IsIn, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const STATUS = ['completed', 'rescheduled', 'missed'];

export class LogPhoneCallDto {
  @ApiProperty({ description: 'Baby UUID' })
  @IsString()
  @IsNotEmpty()
  babyId!: string;

  @ApiProperty({ enum: STATUS })
  @IsIn(STATUS)
  status!: 'completed' | 'rescheduled' | 'missed';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  callDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nextSteps?: string;
}

