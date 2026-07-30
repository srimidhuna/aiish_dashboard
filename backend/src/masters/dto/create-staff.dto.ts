import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsIn,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStaffDto {
  @ApiProperty({ example: 'EMP001', description: 'Unique employee ID' })
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({ example: 'Dr. Anitha Rao' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ enum: ['male', 'female', 'other'] })
  @IsIn(['male', 'female', 'other'])
  gender!: string;

  @ApiProperty({ example: '1990-05-15' })
  @IsDateString()
  dateOfBirth!: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  mobileNumber!: string;

  @ApiProperty({ example: 'anitha@aiish.gov.in' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'audiologist', enum: ['audiologist', 'doctor', 'nurse', 'technician', 'other'] })
  @IsIn(['audiologist', 'doctor', 'nurse', 'technician', 'other'])
  role!: string;

  @ApiProperty({ example: 'Senior Audiologist' })
  @IsString()
  @IsNotEmpty()
  designation!: string;

  @ApiProperty({ example: 'POCD' })
  @IsString()
  @IsNotEmpty()
  department!: string;

  @ApiProperty({ example: 'M.Sc. Audiology' })
  @IsString()
  @IsNotEmpty()
  qualification!: string;

  @ApiProperty({ example: 'RCI/AUD/12345' })
  @IsString()
  @IsNotEmpty()
  licenseNumber!: string;

  @ApiProperty({ example: 5, description: 'Years of professional experience' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  yearsOfExperience!: number;

  @ApiPropertyOptional({ description: 'Base64 data URL or remote URL of profile photo' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Hospital UUID (optional)' })
  @IsOptional()
  @IsString()
  hospitalId?: string;
}
