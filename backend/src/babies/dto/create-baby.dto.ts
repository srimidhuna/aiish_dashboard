import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsIn,
  IsInt,
  Min,
  IsEmail,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AudiologistAssessmentDto } from '@/babies/dto/audiologist-assessment.dto';

const GENDER = ['male', 'female', 'other'];
const REFERRED_BY = ['pocd_staff', 'doctor', 'self', 'others'];
const REGION = ['urban', 'rural'];
const EDUCATION_LEVEL = ['illiterate', 'primary', 'high_school', 'graduate_and_above', 'others'];
const RELIGION = ['hindu', 'muslim', 'christian', 'others'];
const SOCIO_ECONOMIC_STATUS = ['aay', 'bpl', 'apl'];
const DELIVERY_TYPE = ['normal', 'caesarean', 'breech', 'home'];

export class CreateBabyDto {
  // ── Identifiers ──
  @ApiPropertyOptional() @IsOptional() @IsString() mrNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pocdNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() uniqueMotherId?: string;

  // ── Child info ──
  @ApiProperty() @IsString() @IsNotEmpty() firstName!: string;
  @ApiProperty() @IsString() @IsNotEmpty() lastName!: string;
  @ApiProperty() @IsDateString() dob!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timeOfBirth?: string;
  @ApiProperty({ enum: GENDER }) @IsIn(GENDER) gender!: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) birthWeightGrams?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) gestationalAgeWeeks?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() placeOfBirth?: string;

  // ── Parent info ──
  @ApiProperty() @IsString() @IsNotEmpty() motherName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fatherName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() whatsappNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone2?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() taluk?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pinCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentDistrict?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentState?: string;

  // ── Location / hospital ──
  @ApiProperty({ description: 'District UUID' }) @IsString() @IsNotEmpty() districtId!: string;
  @ApiProperty({ description: 'Hospital UUID' }) @IsString() @IsNotEmpty() hospitalId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() department?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() doctorName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assessingStaffId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assessingStaffEmployeeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assessingStaffName?: string;

  // ── Socio-demographics (paper datasheet) ──
  @ApiPropertyOptional({ enum: REFERRED_BY }) @IsOptional() @IsIn(REFERRED_BY) referredBy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referredByOther?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nbsCentre?: string;
  @ApiPropertyOptional({ enum: REGION }) @IsOptional() @IsIn(REGION) region?: string;
  @ApiPropertyOptional({ enum: EDUCATION_LEVEL })
  @IsOptional()
  @IsIn(EDUCATION_LEVEL)
  educationLevel?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() educationLevelOther?: string;
  
  @ApiPropertyOptional({ enum: RELIGION }) @IsOptional() @IsIn(RELIGION) religion?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() religionOther?: string;
  @ApiPropertyOptional({ enum: SOCIO_ECONOMIC_STATUS })
  @IsOptional()
  @IsIn(SOCIO_ECONOMIC_STATUS)
  socioEconomicStatus?: string;
  @ApiPropertyOptional({ enum: DELIVERY_TYPE })
  @IsOptional()
  @IsIn(DELIVERY_TYPE)
  deliveryType?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) noOfSiblings?: number;

  // ── High-Risk Register (medical professional checklist) ──
  @ApiPropertyOptional({ type: [String], description: 'RiskCategory UUIDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  riskFactorIds?: string[];

  // ── Audiologist's assessment ──
  @ApiPropertyOptional({ type: AudiologistAssessmentDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AudiologistAssessmentDto)
  assessment?: AudiologistAssessmentDto;

  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
}
