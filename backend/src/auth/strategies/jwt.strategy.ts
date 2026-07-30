import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '@/common/prisma/prisma.service';

/**
 * JwtPayload — the data encoded inside the JWT access token.
 * Kept minimal to reduce token size; full profile is fetched from DB in /auth/me.
 */
export interface JwtPayload {
  sub: string; // User UUID
  email: string;
  role: string;
  hospitalId: string;
}

/**
 * JwtStrategy
 *
 * Extracts the JWT from the 'access_token' HttpOnly cookie (not from Authorization header).
 * This is intentional: health data tokens must not be readable from JS.
 *
 * On valid token: validates the user still exists (not deleted) and returns JwtPayload.
 * On invalid token or missing user: throws UnauthorizedException.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    super({
      // Extract JWT from the HttpOnly cookie named 'access_token'
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request): string | null => {
          const token: unknown = request?.cookies?.['access_token'];
          if (typeof token === 'string' && token.length > 0) {
            return token;
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Called after the JWT signature is verified.
   * Validates the user exists and has not been soft-deleted.
   * The returned value is attached to request.user by Passport.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        deletedAt: null, // Reject soft-deleted users
      },
      select: { id: true },
    });

    if (!user) {
      throw new UnauthorizedException('User account not found or has been deactivated.');
    }

    return payload;
  }
}
