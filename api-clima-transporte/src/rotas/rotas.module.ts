import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RotasService } from './rotas.service';

@Module({
  imports: [ConfigModule],
  providers: [RotasService],
  exports: [RotasService],
})
export class RotasModule {}
