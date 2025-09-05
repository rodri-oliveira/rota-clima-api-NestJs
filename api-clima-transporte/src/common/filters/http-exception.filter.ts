import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const traceId = request?.headers?.['x-trace-id'] || request?.id || undefined;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Erro interno do servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();
      message = (res && (res.message || res.error)) || exception.message;
    } else if (exception instanceof Error) {
      message = exception.message || message;
    }

    const payload = {
      statusCode: status,
      message,
      path: request?.url,
      method: request?.method,
      timestamp: new Date().toISOString(),
      traceId,
    };

    // Log estruturado do erro (sem stack em produção)
    if (exception instanceof Error && process.env.NODE_ENV !== 'production') {
      this.logger.error(message, exception.stack, HttpExceptionFilter.name);
    } else {
      this.logger.error(JSON.stringify(payload));
    }

    response.status(status).json(payload);
  }
}
