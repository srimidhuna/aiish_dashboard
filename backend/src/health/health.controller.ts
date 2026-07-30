import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

/**
 * HealthController
 *
 * Exposes GET /health — intentionally NOT versioned and NOT behind auth.
 * Used by:
 *   - Docker healthchecks (docker-compose healthcheck.test)
 *   - Uptime monitoring probes
 *
 * This endpoint must remain stable across API version bumps —
 * probes should never need to track /api/v1/health vs /api/v2/health.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Service health check',
    description:
      'Returns { status: "ok" } when the service is running. No authentication required. ' +
      'Used by Docker healthchecks and uptime probes.',
  })
  @ApiOkResponse({
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
      },
    },
  })
  check(): { status: string } {
    return { status: 'ok' };
  }
}
