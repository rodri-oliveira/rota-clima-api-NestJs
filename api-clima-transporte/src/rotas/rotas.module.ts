import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RotasService } from './rotas.service';
import { GeocodingModule } from '../geocoding/geocoding.module';

@Module({
  imports: [ConfigModule, GeocodingModule],
  providers: [RotasService],
  exports: [RotasService],
})
export class RotasModule {}
