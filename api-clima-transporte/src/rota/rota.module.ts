import { Module } from '@nestjs/common';
import { RotaController } from './rota.controller';
import { RotaService } from './rota.service';
import { PrismaModule } from '../infra/database/prisma.module';
import { ClimaModule } from '../clima/clima.module';

@Module({
  imports: [PrismaModule, ClimaModule],
  controllers: [RotaController],
  providers: [RotaService],
})
export class RotaModule {}
