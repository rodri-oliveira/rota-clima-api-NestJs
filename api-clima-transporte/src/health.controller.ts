import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  verificarSaude() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
