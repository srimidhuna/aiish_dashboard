import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * JwtAuthGuard
 *
 * Wraps Passport's 'jwt' strategy. Apply to any controller or route
 * that requires an authenticated user.
 *
 * On success: attaches the JWT payload to request.user.
 * On failure: throws UnauthorizedException (caught by HttpExceptionFilter).
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('protected-route')
 *   getProtected(@CurrentUser() user: JwtPayload) { ... }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }
}
