import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

// Lazy require to avoid issues in environments without prom-client installed
let client: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  client = require('prom-client');
  // Ensure default metrics are collected once
  if ((client as any)._climaTransporteDefaultMetricsStarted !== true) {
    client.collectDefaultMetrics();
    (client as any)._climaTransporteDefaultMetricsStarted = true;
  }
} catch {
  // prom-client not installed; interceptor becomes a no-op
}

// Define metrics using the default registry, guarded if prom-client exists
const requestCounter = client
  ? new client.Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status'] as const,
    })
  : null;

const durationHistogram = client
  ? new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'] as const,
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    })
  : null;

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // If prom-client is not present, pass-through
    if (!client) return next.handle();

    const now = process.hrtime.bigint();

    const http = context.switchToHttp();
    const req = http.getRequest<any>();

    const method: string = (req?.method || 'UNKNOWN').toUpperCase();
    // Prefer Express route path when available (e.g., "/rota") to avoid high-cardinality labels
    const route: string = req?.route?.path || req?.path || 'unknown';

    return next.handle().pipe(
      tap(() => {
        const res = http.getResponse<any>();
        const status = String(res?.statusCode ?? 200);

        const elapsedNs = Number(process.hrtime.bigint() - now);
        const seconds = elapsedNs / 1e9;

        requestCounter?.labels(method, route, status).inc();
        durationHistogram?.labels(method, route, status).observe(seconds);
      }),
    );
  }
}
