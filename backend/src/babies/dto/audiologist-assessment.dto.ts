import { IsBoolean, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const CONSANGUINITY = ['first', 'second', 'third'];
const REFLEX = ['normal', 'abnormal'];

export class AudiologistAssessmentDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  familyHistoryHearingLoss?: boolean;

  @ApiPropertyOptional({ enum: CONSANGUINITY })
  @IsOptional()
  @IsIn(CONSANGUINITY)
  consanguinityDegree?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  caregiverConcern?: boolean;

  @ApiPropertyOptional({ enum: REFLEX })
  @IsOptional()
  @IsIn(REFLEX)
  reflexMoro?: string;

  @ApiPropertyOptional({ enum: REFLEX })
  @IsOptional()
  @IsIn(REFLEX)
  reflexRooting?: string;

  @ApiPropertyOptional({ enum: REFLEX })
  @IsOptional()
  @IsIn(REFLEX)
  reflexBabinski?: string;

  @ApiPropertyOptional({ enum: REFLEX })
  @IsOptional()
  @IsIn(REFLEX)
  reflexPalmar?: string;

  @ApiPropertyOptional({ enum: REFLEX })
  @IsOptional()
  @IsIn(REFLEX)
  reflexPlantar?: string;
}
