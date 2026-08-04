import { IsString, IsNotEmpty, IsOptional, IsIn, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const TEST_RESULT = ['pass', 'refer', 'noisy', 'cnt', 'not_done'];
const PASS_REFER = ['pass', 'refer'];
const STATUS = ['draft', 'scheduled', 'completed'];

export class CreateScreeningDto {
  @ApiProperty({ description: 'Baby UUID' })
  @IsString()
  @IsNotEmpty()
  babyId!: string;

  @ApiPropertyOptional({ enum: STATUS, default: 'draft' })
  @IsOptional()
  @IsIn(STATUS)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assignedAudiologistId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() entFindings?: string;

  @ApiPropertyOptional({ enum: TEST_RESULT }) @IsOptional() @IsIn(TEST_RESULT) boaResult?: string;

  @ApiPropertyOptional({ enum: TEST_RESULT }) @IsOptional() @IsIn(TEST_RESULT) teoaeRight?: string;
  @ApiPropertyOptional({ enum: TEST_RESULT }) @IsOptional() @IsIn(TEST_RESULT) teoaeLeft?: string;
  @ApiPropertyOptional({ enum: TEST_RESULT }) @IsOptional() @IsIn(TEST_RESULT) dpoaeRight?: string;
  @ApiPropertyOptional({ enum: TEST_RESULT }) @IsOptional() @IsIn(TEST_RESULT) dpoaeLeft?: string;
  @ApiPropertyOptional({ enum: TEST_RESULT }) @IsOptional() @IsIn(TEST_RESULT) aabr1Right?: string;
  @ApiPropertyOptional({ enum: TEST_RESULT }) @IsOptional() @IsIn(TEST_RESULT) aabr1Left?: string;
  @ApiPropertyOptional({ enum: TEST_RESULT }) @IsOptional() @IsIn(TEST_RESULT) aabr2Right?: string;
  @ApiPropertyOptional({ enum: TEST_RESULT }) @IsOptional() @IsIn(TEST_RESULT) aabr2Left?: string;

  @ApiPropertyOptional({ enum: PASS_REFER }) @IsOptional() @IsIn(PASS_REFER) overallResult?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
}
