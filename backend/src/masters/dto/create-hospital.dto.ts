import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHospitalDto {
  @ApiProperty({ example: 'Mysuru General Hospital' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'District UUID', example: 'uuid-of-district' })
  @IsString()
  @IsNotEmpty()
  districtId!: string;

  @ApiPropertyOptional({ example: 'Sayyaji Rao Rd, Mysuru' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Dr. Rao' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'User UUID (role=audiologist) to set as primary audiologist',
  })
  @IsOptional()
  @IsString()
  primaryAudiologistId?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive'], default: 'active' })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
