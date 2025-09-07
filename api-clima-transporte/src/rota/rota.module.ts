import { Module } from '@nestjs/common';
import { RotaController } from './rota.controller';
import { RotaService } from './rota.service';
import { PrismaModule } from '../infra/database/prisma.module';
import { ClimaModule } from '../clima/clima.module';
import { RotasModule } from '../rotas/rotas.module';
import { RedisCacheService } from '../common/cache/redis-cache.service';

@Module({
  imports: [PrismaModule, ClimaModule, RotasModule],
  controllers: [RotaController],
  providers: [RotaService, RedisCacheService],
})
export class RotaModule {}
