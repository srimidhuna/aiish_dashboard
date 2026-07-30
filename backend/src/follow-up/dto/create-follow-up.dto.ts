import { IsString, IsNotEmpty, IsOptional, IsIn, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const FOLLOW_UP_TYPE = ['phone', 'regular', 'not_applicable'];

export class CreateFollowUpDto {
  @ApiProperty({ description: 'Baby UUID' })
  @IsString()
  @IsNotEmpty()
  babyId!: string;

  @ApiProperty({ enum: FOLLOW_UP_TYPE })
  @IsIn(FOLLOW_UP_TYPE)
  followUpType!: string;

  @ApiProperty({ description: 'ISO date the follow-up is scheduled for' })
  @IsDateString()
  scheduledDate!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() provisionalDiagnosisRight?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() provisionalDiagnosisLeft?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nextSteps?: string;

  @ApiPropertyOptional({ type: [String], description: 'RecommendationType UUIDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendationTypeIds?: string[];
}
