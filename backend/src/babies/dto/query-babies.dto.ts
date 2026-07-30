import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryBabiesDto {
  @ApiPropertyOptional({ description: 'Free-text search over name / mrNumber' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() districtId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() hospitalId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() audiologistId?: string;

  @ApiPropertyOptional({ enum: ['male', 'female', 'other'] })
  @IsOptional()
  @IsIn(['male', 'female', 'other'])
  gender?: string;

  @ApiPropertyOptional({ enum: ['ALL', 'YES', 'NO'] })
  @IsOptional()
  @IsIn(['ALL', 'YES', 'NO'])
  riskFactor?: string;

  @ApiPropertyOptional({ enum: ['ALL', 'PASS', 'REFER', 'PENDING'] })
  @IsOptional()
  @IsIn(['ALL', 'PASS', 'REFER', 'PENDING'])
  referralStatus?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString() dateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateTo?: string;
}
