import { Module } from '@nestjs/common';
import { FavoritosController } from './favoritos.controller';
import { FavoritosService } from './favoritos.service';
import { PrismaModule } from '../infra/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FavoritosController],
  providers: [FavoritosService],
})
export class FavoritosModule {}
