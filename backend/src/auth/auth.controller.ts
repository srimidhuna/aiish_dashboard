import { Controller, Post, Get, Body, Res, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';

import { AuthService } from '@/auth/auth.service';
import { LoginDto } from '@/auth/dto/login.dto';
import { UserProfileDto } from '@/auth/dto/user-profile.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/strategies/jwt.strategy';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── POST /api/v1/auth/login ────────────────────────────────────────────────

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Staff login',
    description:
      'Validates email and password. On success, issues a JWT stored in an ' +
      'HttpOnly, SameSite cookie named "access_token". The cookie is sent ' +
      'automatically with all subsequent requests — the frontend must use ' +
      'withCredentials:true (set in Prompt 1B).',
  })
  @ApiOkResponse({
    description: 'Login successful — JWT cookie set',
    type: UserProfileDto,
  })
  @ApiBadRequestResponse({ description: 'Validation error (missing/invalid fields)' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserProfileDto> {
    return this.authService.login(loginDto, response);
  }

  // ── POST /api/v1/auth/logout ───────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({
    summary: 'Staff logout',
    description: 'Clears the JWT access token cookie. Requires an active session.',
  })
  @ApiOkResponse({
    description: 'Logout successful — cookie cleared',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out successfully.' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  logout(@Res({ passthrough: true }) response: Response): { message: string } {
    this.authService.logout(response);
    return { message: 'Logged out successfully.' };
  }

  // ── GET /api/v1/auth/me ────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      "Returns the authenticated user's profile. The frontend uses this endpoint " +
      'to determine login state without being able to read the HttpOnly cookie directly. ' +
      'Returns 401 if the cookie is absent or the token is expired/invalid.',
  })
  @ApiOkResponse({
    description: 'Authenticated user profile (no password hash)',
    type: UserProfileDto,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated or token expired' })
  async getMe(@CurrentUser() user: JwtPayload): Promise<UserProfileDto> {
    return this.authService.getProfile(user.sub);
  }
}
