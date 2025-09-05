import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request?.method;
    const url = request?.originalUrl || request?.url;
    const traceId = request?.headers?.['x-trace-id'] || request?.id || undefined;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response?.statusCode;
        const durationMs = Date.now() - startedAt;
        this.logger.log(
          JSON.stringify({ method, url, statusCode, durationMs, traceId }),
        );
      }),
    );
  }
}
