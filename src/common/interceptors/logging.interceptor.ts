import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') ?? '';
    const userId =
      (request as unknown as Record<string, unknown>).user?.['id'] ??
      'anonymous';
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = ctx.getResponse<Response>();
        this.emitLog({
          level: 'INFO',
          method,
          path: originalUrl,
          statusCode: response.statusCode,
          durationMs: Date.now() - startTime,
          userId,
          ip,
          userAgent,
        });
      }),
      catchError((error) => {
        this.emitLog({
          level: 'ERROR',
          method,
          path: originalUrl,
          statusCode: error.status ?? 500,
          durationMs: Date.now() - startTime,
          userId,
          ip,
          userAgent,
          error: error.message,
        });
        throw error;
      }),
    );
  }

  private emitLog(fields: Record<string, unknown>) {
    const entry = {
      ...fields,
      timestamp: new Date().toISOString(),
      service: 'swipematch-api',
    };

    if (fields.level === 'ERROR') {
      this.logger.error(JSON.stringify(entry));
    } else {
      this.logger.log(JSON.stringify(entry));
    }
  }
}
