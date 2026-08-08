import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';

import { PrismaService } from '@/common/prisma/prisma.service';
import { LoginDto } from '@/auth/dto/login.dto';
import { UserProfileDto } from '@/auth/dto/user-profile.dto';
import { JwtPayload } from '@/auth/strategies/jwt.strategy';

/** Cookie name for the JWT access token */
export const ACCESS_TOKEN_COOKIE = 'access_token';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validates credentials and issues a signed JWT in an HttpOnly cookie.
   *
   * Security notes:
   * - Never log the password, password hash, or the generated JWT.
   * - Log only the event and the email (identifier).
   * - bcrypt.compare is timing-safe.
   */
  async login(dto: LoginDto, response: Response): Promise<UserProfileDto> {
    // Find user by email (include soft-deleted check)
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        deletedAt: null,
      },
    });

    // Use constant-time comparison even when user not found
    // (prevents email enumeration via timing attacks)
    const dummyHash = '$2b$12$invalid.hash.for.timing.safety.only.padding';
    const hashToCompare = user?.passwordHash ?? dummyHash;
    const passwordMatch = await bcrypt.compare(dto.password, hashToCompare);

    if (!user || !passwordMatch) {
      // Log the event and identifier — never log the password
      this.logger.warn(`Authentication failed for email: ${dto.email}`);
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Build JWT payload
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
    };

    // Sign the token — never log the resulting token
    const token = this.jwtService.sign(payload);

    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    // Set the JWT as an HttpOnly, SameSite cookie so JS cannot read it.
    // SameSite:
    //   - 'lax'  in development (allows cross-origin dev setups with localhost)
    //   - 'none' in production  (required for cross-origin: frontend on Vercel,
    //                            backend on Render — different domains)
    //             NOTE: SameSite=None requires Secure=true (HTTPS), which is
    //             already enforced in production.
    // Secure:
    //   - false in development (no HTTPS locally)
    //   - true  in production  (requires HTTPS)
    response.cookie(ACCESS_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      // maxAge mirrors the JWT expiry (default 8h = 28800000ms)
      maxAge: this.parseExpiryToMs(this.configService.get<string>('JWT_EXPIRES_IN') ?? '8h'),
    });

    this.logger.log(`Authentication successful for email: ${user.email}`);

    // Return safe profile — never include passwordHash
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      hospitalId: user.hospitalId,
    };
  }

  /**
   * Clears the JWT cookie, effectively logging the user out.
   * Works even if the token has already expired.
   */
  logout(response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE, {
      httpOnly: true,
      path: '/',
    });
    this.logger.log('User logged out — access token cookie cleared.');
  }

  /**
   * Returns the authenticated user's profile from the database.
   * The JWT payload (from JwtStrategy) is used to look up fresh data.
   * Ensures the user still exists and is not soft-deleted.
   *
   * Never returns passwordHash.
   */
  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        hospitalId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User account not found or has been deactivated.');
    }

    return user;
  }

  /**
   * Converts a JWT expiry string (e.g. '8h', '1d', '30m') to milliseconds
   * for use as cookie maxAge.
   */
  private parseExpiryToMs(expiry: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiry);
    if (!match) return 8 * 60 * 60 * 1000; // default 8h

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * (multipliers[unit] ?? 1000);
  }
}
