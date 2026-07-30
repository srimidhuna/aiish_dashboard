import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class HospitalQueryDto {
  @ApiPropertyOptional({ description: 'Free-text search over hospital name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by state name' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Filter by district UUID' })
  @IsOptional()
  @IsString()
  districtId?: string;
}
