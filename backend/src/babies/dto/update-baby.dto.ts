import {
  IsString,
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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AudiologistAssessmentDto } from '@/babies/dto/audiologist-assessment.dto';

const GENDER = ['male', 'female', 'other'];
const REFERRED_BY = ['pocd_staff', 'doctor', 'self', 'others'];
const REGION = ['urban', 'rural'];
const EDUCATION_LEVEL = ['illiterate', 'primary', 'high_school', 'graduate_and_above', 'others'];
const RELIGION = ['hindu', 'muslim', 'christian', 'others'];
const SOCIO_ECONOMIC_STATUS = ['aay', 'bpl', 'apl'];
const DELIVERY_TYPE = ['normal', 'caesarean', 'breech', 'home'];
const BABY_STATUS = [
  'draft',
  'completed',
  'follow_up_required',
  'under_evaluation',
  'under_treatment',
  'closed',
];

export class UpdateBabyDto {
  @ApiPropertyOptional() @IsOptional() @IsString() mrNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pocdNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() uniqueMotherId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dob?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timeOfBirth?: string;
  @ApiPropertyOptional({ enum: GENDER }) @IsOptional() @IsIn(GENDER) gender?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) birthWeightGrams?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) gestationalAgeWeeks?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() placeOfBirth?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() motherName?: string;
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

  @ApiPropertyOptional() @IsOptional() @IsString() districtId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() hospitalId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() department?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() doctorName?: string;

  @ApiPropertyOptional({ enum: REFERRED_BY }) @IsOptional() @IsIn(REFERRED_BY) referredBy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referredByOther?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nbsCentre?: string;
  @ApiPropertyOptional({ enum: REGION }) @IsOptional() @IsIn(REGION) region?: string;
  @ApiPropertyOptional({ enum: EDUCATION_LEVEL })
  @IsOptional()
  @IsIn(EDUCATION_LEVEL)
  educationLevel?: string;
  @ApiPropertyOptional({ enum: RELIGION }) @IsOptional() @IsIn(RELIGION) religion?: string;
  @ApiPropertyOptional({ enum: SOCIO_ECONOMIC_STATUS })
  @IsOptional()
  @IsIn(SOCIO_ECONOMIC_STATUS)
  socioEconomicStatus?: string;
  @ApiPropertyOptional({ enum: DELIVERY_TYPE })
  @IsOptional()
  @IsIn(DELIVERY_TYPE)
  deliveryType?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) noOfSiblings?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  riskFactorIds?: string[];

  @ApiPropertyOptional({ type: AudiologistAssessmentDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AudiologistAssessmentDto)
  assessment?: AudiologistAssessmentDto;

  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;

  @ApiPropertyOptional({ enum: BABY_STATUS }) @IsOptional() @IsIn(BABY_STATUS) status?: string;
}
