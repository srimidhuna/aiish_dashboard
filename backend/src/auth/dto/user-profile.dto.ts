import { ApiProperty } from '@nestjs/swagger';

/**
 * UserProfileDto — response body for GET /api/v1/auth/me
 *
 * Explicitly excludes password_hash and deleted_at.
 * This is the only user data shape the frontend will receive.
 */
export class UserProfileDto {
  @ApiProperty({
    description: 'Unique user ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Staff email address',
    example: 'audiologist@aiish.in',
  })
  email!: string;

  @ApiProperty({
    description: 'Full display name',
    example: 'Demo Audiologist',
  })
  fullName!: string;

  @ApiProperty({
    description: 'Staff role',
    enum: ['audiologist', 'admin', 'doctor'],
    example: 'audiologist',
  })
  role!: string;

  @ApiProperty({
    description: 'Hospital this user belongs to (UUID)',
    example: 'aiish-hospital-seed-id-000000000001',
  })
  hospitalId!: string;
}
