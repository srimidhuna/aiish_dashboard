import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

import { AppModule } from '@/app.module';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    // Use NestJS built-in logger — buffers logs during init
    logger: ['log', 'warn', 'error', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3001;
  const frontendOrigin = configService.get<string>('FRONTEND_ORIGIN') ?? 'http://localhost:3000';
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const isProduction = nodeEnv === 'production';

  // ── CORS ────────────────────────────────────────────────────────────────────
  // Allow only the configured frontend origin — no wildcard *.
  // credentials:true is required so the browser sends the HttpOnly JWT cookie.
  // NOTE (Prompt 1B integration): The frontend must set withCredentials:true
  // on every request, otherwise the browser will not attach the cookie.
  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  });

  // ── Cookie parser ───────────────────────────────────────────────────────────
  // Required for the JWT strategy to read the token from the 'access_token' cookie.
  app.use(cookieParser());

  // ── Global API prefix + versioning ──────────────────────────────────────────
  // All routes get /api/v1/... prefix EXCEPT the /health endpoint which is
  // registered directly on the root HealthController with no prefix.
  app.setGlobalPrefix('api', {
    exclude: ['health'], // /health is NOT versioned — used by Docker healthchecks
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ── Global validation pipe ──────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Reject requests with unknown props
      transform: true, // Auto-transform payloads to DTO class instances
    }),
  );

  // ── Global exception filter ─────────────────────────────────────────────────
  // Returns a uniform { statusCode, message, error, timestamp, path } shape.
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Swagger / OpenAPI ───────────────────────────────────────────────────────
  // Disabled automatically in production to avoid exposing API surface.
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AIISH Newborn Hearing Screening API')
      .setDescription(
        'Internal staff portal API for the AIISH Newborn Hearing Screening Management System. ' +
          'Authentication uses HttpOnly cookies — use the /api/v1/auth/login endpoint first, ' +
          'then the cookie is sent automatically with subsequent requests.',
      )
      .setVersion('1.0')
      .addCookieAuth('access_token', {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description: 'JWT stored in HttpOnly cookie. Login via POST /api/v1/auth/login first.',
      })
      .addTag('auth', 'Authentication endpoints (login, logout, me)')
      .addTag('babies', 'Baby registration and management')
      .addTag('screening', 'Hearing screening records')
      .addTag('follow-up', 'Follow-up appointments and recommendations')
      .addTag('masters', 'Master data (hospitals, districts, states, risk categories)')
      .addTag('dashboard', 'Dashboard statistics and summaries')
      .addTag('health', 'Service health check (no auth required)')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        withCredentials: true, // Swagger UI sends cookies with requests
      },
    });

    logger.log('Swagger UI available at /api/docs');
  } else {
    logger.log('Swagger UI disabled in production (NODE_ENV=production)');
  }

  // ── Start listening ─────────────────────────────────────────────────────────
  await app.listen(port, '0.0.0.0');

  logger.log(`AIISH Backend running on port ${port} [${nodeEnv}]`);
  logger.log(`CORS allowed origin: ${frontendOrigin}`);
  if (!isProduction) {
    logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
