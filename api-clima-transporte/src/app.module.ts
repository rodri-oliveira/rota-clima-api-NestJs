import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infra/database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FavoritosModule } from './favoritos/favoritos.module';
import { HistoricoModule } from './historico/historico.module';
import { RotaModule } from './rota/rota.module';
import { ClimaModule } from './clima/clima.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ClimaModule,
    FavoritosModule,
    HistoricoModule,
    RotaModule,
    MetricsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
