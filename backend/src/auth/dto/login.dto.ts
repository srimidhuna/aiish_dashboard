import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * LoginDto — request body for POST /api/v1/auth/login
 *
 * Both fields are required. The ValidationPipe will reject requests
 * that are missing either field or have non-string values.
 */
export class LoginDto {
  @ApiProperty({
    description: 'Registered staff email address',
    example: 'audiologist@aiish.in',
    format: 'email',
  })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Account password (minimum 8 characters)',
    example: 'Audiologist@123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  password!: string;
}
