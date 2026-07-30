import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Uniform error response shape returned by all endpoints.
 * Every error from the API will match this interface.
 */
interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

/**
 * GlobalHttpExceptionFilter
 *
 * Catches all HttpExceptions (including NestJS built-ins like UnauthorizedException,
 * NotFoundException, ValidationPipe errors, etc.) and formats them into a consistent
 * JSON shape so clients always know what to expect.
 *
 * Non-HttpExceptions (unexpected errors) are returned as 500 Internal Server Error.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number;
    let message: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp['message'] as string | string[]) ?? exception.message;
        error = (resp['error'] as string) ?? exception.name;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else {
      // Unexpected error — log it but never expose internal details to clients
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred. Please try again later.';
      error = 'Internal Server Error';

      const errMessage = exception instanceof Error ? exception.message : String(exception);
      this.logger.error(`Unhandled exception on ${request.method} ${request.url}: ${errMessage}`);
    }

    const errorBody: ErrorResponse = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(errorBody);
  }
}
