import { Module } from '@nestjs/common';
import { RotaController } from './rota.controller';
import { RotaService } from './rota.service';
import { PrismaModule } from '../infra/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RotaController],
  providers: [RotaService],
})
export class RotaModule {}
