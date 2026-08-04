import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryScreeningDto {
  @ApiPropertyOptional({ enum: ['draft', 'scheduled', 'completed'] })
  @IsOptional()
  @IsIn(['draft', 'scheduled', 'completed'])
  status?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() hospitalId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() districtId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() audiologistId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() babyId?: string;

  @ApiPropertyOptional({ enum: ['pass', 'refer'] })
  @IsOptional()
  @IsIn(['pass', 'refer'])
  result?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString() dateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateTo?: string;
}
