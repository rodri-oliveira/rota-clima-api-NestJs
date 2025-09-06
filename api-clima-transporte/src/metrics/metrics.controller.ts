import { Controller, Get, Header, HttpCode, HttpStatus } from '@nestjs/common';

// Implementação leve de /metrics usando prom-client de forma preguiçosa (lazy),
// para não exigir dependência em tempo de build/teste. Se a lib não estiver
// instalada, retornamos um texto básico com instruções.
@Controller('metrics')
export class MetricsController {
  private promRegistry: any | null = null;
  private initialized = false;

  private async ensurePrometheus(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const client = require('prom-client');
      this.promRegistry = new client.Registry();
      client.collectDefaultMetrics({ register: this.promRegistry });
    } catch (_err) {
      this.promRegistry = null;
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async getMetrics(): Promise<string> {
    await this.ensurePrometheus();
    if (this.promRegistry) {
      return await this.promRegistry.metrics();
    }

    // Fallback simples caso prom-client não esteja instalado
    return [
      '# HELP app_info Static info metric',
      '# TYPE app_info gauge',
      'app_info{service="api-clima-transporte"} 1',
      '',
      '# prom-client not installed. Install with:',
      '# npm i prom-client --registry=https://registry.npmjs.org/'
    ].join('\n');
  }
}
