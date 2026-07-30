import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const STATUS = ['scheduled', 'completed', 'missed', 'lost_to_followup', 'rescheduled'];

export class QueryFollowUpDto {
  @ApiPropertyOptional({ enum: STATUS }) @IsOptional() @IsIn(STATUS) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() hospitalId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() districtId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() babyId?: string;
}
