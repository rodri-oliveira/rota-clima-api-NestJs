import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { randomUUID } from 'crypto';
import { logger } from '../logging/logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = request?.method;
    const url = request?.originalUrl || request?.url;
    const reqHeaderId: string | undefined = request?.headers?.['x-trace-id'] || request?.headers?.['x-request-id'];
    const traceId: string = reqHeaderId || request?.id || randomUUID();
    // expor no response header para correlação client-side
    try {
      response.setHeader('X-Request-Id', traceId);
    } catch {}
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const statusCode = response?.statusCode;
        const durationMs = Date.now() - startedAt;
        logger.info({ method, url, statusCode, durationMs, requestId: traceId }, 'http_request');
      }),
    );
  }
}
