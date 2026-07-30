import { IsString, IsOptional, IsIn, IsDateString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const FOLLOW_UP_TYPE = ['phone', 'regular', 'not_applicable'];

export class UpdateFollowUpDto {
  @ApiPropertyOptional({ enum: FOLLOW_UP_TYPE })
  @IsOptional()
  @IsIn(FOLLOW_UP_TYPE)
  followUpType?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() provisionalDiagnosisRight?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() provisionalDiagnosisLeft?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nextSteps?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendationTypeIds?: string[];
}
